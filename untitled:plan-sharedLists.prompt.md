# Plan: Shared Movie Lists Feature

**TL;DR:**
Implement a collaborative lists feature allowing users to share their movie lists with other registered users through an in-app invitation system. Users can invite others by email, invitees receive in-app notifications and can accept invitations. The system implements a two-tier permission model: **Owners** have full control (manage members, add/remove any items, delete lists), while **Members** can add items and remove only their own additions. No email sending - all notifications and invitations are in-app only. Authentication required for all features via Clerk.

---

## PHASE 1: Database Schema & Migrations

### 1. Create `invitations` table
**File:** Create migration file in `/src/db/migrations/XXXX_add_invitations.sql`

**Purpose:** Track pending, accepted, and rejected invitations to lists.

**Schema:**
```sql
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  inviter_user_id TEXT NOT NULL,
  invitee_email TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMP,
  UNIQUE(list_id, invitee_email)
);

CREATE INDEX idx_invitations_invitee_email ON invitations(invitee_email);
CREATE INDEX idx_invitations_list_id ON invitations(list_id);
CREATE INDEX idx_invitations_status ON invitations(status);
```

**Drizzle Schema Addition (`/src/db/schema.ts`):**
```typescript
export const invitations = pgTable("invitations", {
  id: uuid("id").defaultRandom().primaryKey(),
  listId: uuid("list_id")
    .notNull()
    .references(() => lists.id, { onDelete: "cascade" }),
  inviterUserId: text("inviter_user_id").notNull(),
  inviteeEmail: text("invitee_email").notNull(),
  status: text("status").notNull(), // 'pending' | 'accepted' | 'rejected'
  createdAt: timestamp("created_at", { withTimezone: false })
    .defaultNow()
    .notNull(),
  respondedAt: timestamp("responded_at", { withTimezone: false }),
}, (table) => ({
  uniqueListInvitee: unique().on(table.listId, table.inviteeEmail),
}))
```

**Dependencies:** None - can run first
**Parallel:** Can be done alongside step 2

---

### 2. Create `list_members` table
**File:** Same migration file or separate `/src/db/migrations/XXXX_add_list_members.sql`

**Purpose:** Junction table tracking who has access to which lists and their role.

**Schema:**
```sql
CREATE TABLE list_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'member')),
  joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(list_id, user_id)
);

CREATE INDEX idx_list_members_user_id ON list_members(user_id);
CREATE INDEX idx_list_members_list_id ON list_members(list_id);
```

**Drizzle Schema Addition (`/src/db/schema.ts`):**
```typescript
export const listMembers = pgTable("list_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  listId: uuid("list_id")
    .notNull()
    .references(() => lists.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  role: text("role").notNull(), // 'owner' | 'member'
  joinedAt: timestamp("joined_at", { withTimezone: false })
    .defaultNow()
    .notNull(),
}, (table) => ({
  uniqueListUser: unique().on(table.listId, table.userId),
}))
```

**Dependencies:** None - can run first
**Parallel:** Can be done alongside step 1

---

### 3. Add `added_by` column to `list_items` table
**File:** Create migration `/src/db/migrations/XXXX_add_list_items_added_by.sql`

**Purpose:** Track which user added each item to enable permission checks (members can only delete their own items).

**Schema:**
```sql
ALTER TABLE list_items ADD COLUMN added_by TEXT NOT NULL DEFAULT 'unknown';
CREATE INDEX idx_list_items_added_by ON list_items(added_by);
```

**Drizzle Schema Update (`/src/db/schema.ts`):**
```typescript
export const listItems = pgTable("list_items", {
  // ... existing fields
  addedBy: text("added_by").notNull().default("unknown"),
})
```

**Dependencies:** Must run after existing list_items table exists
**Parallel:** Independent of steps 1 & 2

---

### 4. Data migration: Populate `list_members` for existing lists
**File:** Create data migration script or include in same migration

**Purpose:** For all existing lists, create an `owner` record in `list_members` so authorization logic works consistently.

**Migration:**
```sql
INSERT INTO list_members (list_id, user_id, role, joined_at)
SELECT id, user_id, 'owner', created_at
FROM lists
ON CONFLICT (list_id, user_id) DO NOTHING;
```

**Dependencies:** Requires step 2 (list_members table) to be complete
**Parallel:** Must run after step 2

---

### 5. Run migrations
**Command:** 
```bash
pnpm drizzle-kit generate:pg
pnpm drizzle-kit push:pg
```

**Verification:**
- Check database schema with `\d invitations`, `\d list_members`, `\d list_items`
- Verify indexes exist
- Confirm existing lists have owner records in list_members

**Dependencies:** All schema changes above must be defined
**Parallel:** Final step in Phase 1

---

## PHASE 2: Backend Services & API

### 6. Create invitation service
**File:** `/src/lib/services/invitations.ts`

**Purpose:** Business logic for creating, accepting, rejecting, and querying invitations. Includes Clerk email validation.

**Key Functions:**
```typescript
import "server-only"
import type { z } from "zod"
import { and, eq, or } from "drizzle-orm"
import { db } from "@/lib/db"
import { invitations, lists, listMembers } from "@/db/schema"
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors"
import { clerkClient } from "@clerk/nextjs/server"

export type InvitationDto = {
  id: string
  listId: string
  listName: string
  inviterUserId: string
  inviteeEmail: string
  status: "pending" | "accepted" | "rejected"
  createdAt: string
  respondedAt: string | null
}

const toInvitationDto = (row: InferSelectModel<typeof invitations>, listName?: string): InvitationDto => ({
  id: row.id,
  listId: row.listId,
  listName: listName ?? "",
  inviterUserId: row.inviterUserId,
  inviteeEmail: row.inviteeEmail,
  status: row.status as "pending" | "accepted" | "rejected",
  createdAt: row.createdAt.toISOString(),
  respondedAt: row.respondedAt?.toISOString() ?? null,
})

export const invitationsService = {
  async create(listId: string, inviterUserId: string, inviteeEmail: string): Promise<InvitationDto> {
    // 1. Verify list exists and inviter is owner
    const listRows = await db.select().from(lists).where(eq(lists.id, listId)).limit(1)
    const list = listRows[0]
    if (!list) throw new NotFoundError("List not found")
    
    const memberRows = await db
      .select()
      .from(listMembers)
      .where(and(eq(listMembers.listId, listId), eq(listMembers.userId, inviterUserId)))
      .limit(1)
    
    if (!memberRows[0] || memberRows[0].role !== "owner") {
      throw new ForbiddenError("Only list owners can invite members")
    }

    // 2. Validate invitee email exists in Clerk
    const client = await clerkClient()
    const clerkUsers = await client.users.getUserList({ emailAddress: [inviteeEmail] })
    if (clerkUsers.totalCount === 0) {
      throw new ValidationError("User with this email not found")
    }
    const inviteeUserId = clerkUsers.data[0].id

    // 3. Check if user is already a member
    const existingMember = await db
      .select()
      .from(listMembers)
      .where(and(eq(listMembers.listId, listId), eq(listMembers.userId, inviteeUserId)))
      .limit(1)
    
    if (existingMember[0]) {
      throw new ConflictError("User is already a member of this list")
    }

    // 4. Check for existing pending invitation
    const existingInvite = await db
      .select()
      .from(invitations)
      .where(and(eq(invitations.listId, listId), eq(invitations.inviteeEmail, inviteeEmail)))
      .limit(1)
    
    if (existingInvite[0] && existingInvite[0].status === "pending") {
      throw new ConflictError("Invitation already sent to this user")
    }

    // 5. Create invitation
    const rows = await db
      .insert(invitations)
      .values({
        listId,
        inviterUserId,
        inviteeEmail,
        status: "pending",
      })
      .returning()

    return toInvitationDto(rows[0], list.name)
  },

  async getPendingByEmail(email: string): Promise<InvitationDto[]> {
    const rows = await db
      .select({
        invitation: invitations,
        list: lists,
      })
      .from(invitations)
      .innerJoin(lists, eq(invitations.listId, lists.id))
      .where(and(
        eq(invitations.inviteeEmail, email),
        eq(invitations.status, "pending")
      ))

    return rows.map(row => toInvitationDto(row.invitation, row.list.name))
  },

  async accept(invitationId: string, userId: string, userEmail: string): Promise<void> {
    const rows = await db
      .select()
      .from(invitations)
      .where(eq(invitations.id, invitationId))
      .limit(1)
    
    const invitation = rows[0]
    if (!invitation) throw new NotFoundError("Invitation not found")
    if (invitation.inviteeEmail !== userEmail) {
      throw new ForbiddenError("This invitation is not for you")
    }
    if (invitation.status !== "pending") {
      throw new ConflictError("Invitation already responded to")
    }

    // Add user as member
    await db.insert(listMembers).values({
      listId: invitation.listId,
      userId,
      role: "member",
    })

    // Update invitation status
    await db
      .update(invitations)
      .set({ status: "accepted", respondedAt: new Date() })
      .where(eq(invitations.id, invitationId))
  },

  async reject(invitationId: string, userEmail: string): Promise<void> {
    const rows = await db
      .select()
      .from(invitations)
      .where(eq(invitations.id, invitationId))
      .limit(1)
    
    const invitation = rows[0]
    if (!invitation) throw new NotFoundError("Invitation not found")
    if (invitation.inviteeEmail !== userEmail) {
      throw new ForbiddenError("This invitation is not for you")
    }
    if (invitation.status !== "pending") {
      throw new ConflictError("Invitation already responded to")
    }

    await db
      .update(invitations)
      .set({ status: "rejected", respondedAt: new Date() })
      .where(eq(invitations.id, invitationId))
  },

  async getByList(listId: string, userId: string): Promise<InvitationDto[]> {
    // Verify user has access to list
    const memberRows = await db
      .select()
      .from(listMembers)
      .where(and(eq(listMembers.listId, listId), eq(listMembers.userId, userId)))
      .limit(1)
    
    if (!memberRows[0]) {
      throw new ForbiddenError("You don't have access to this list")
    }

    const rows = await db
      .select({
        invitation: invitations,
        list: lists,
      })
      .from(invitations)
      .innerJoin(lists, eq(invitations.listId, lists.id))
      .where(eq(invitations.listId, listId))

    return rows.map(row => toInvitationDto(row.invitation, row.list.name))
  },
}
```

**Dependencies:** Phase 1 complete (schema)
**Parallel:** Can develop alongside step 7

**Pattern Reference:** Similar to `/src/lib/services/lists.ts` - uses server-only, error classes, DTO pattern

---

### 7. Create list-members service
**File:** `/src/lib/services/list-members.ts`

**Purpose:** Manage list membership - query members, remove members, check permissions.

**Key Functions:**
```typescript
import "server-only"
import { and, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { listMembers, lists } from "@/db/schema"
import { ForbiddenError, NotFoundError } from "@/lib/errors"
import { clerkClient } from "@clerk/nextjs/server"

export type ListMemberDto = {
  id: string
  listId: string
  userId: string
  role: "owner" | "member"
  joinedAt: string
  // Enriched from Clerk
  email: string | null
  name: string | null
  imageUrl: string | null
}

export const listMembersService = {
  async getByList(listId: string, requestingUserId: string): Promise<ListMemberDto[]> {
    // Verify requesting user has access
    const accessCheck = await db
      .select()
      .from(listMembers)
      .where(and(eq(listMembers.listId, listId), eq(listMembers.userId, requestingUserId)))
      .limit(1)
    
    if (!accessCheck[0]) {
      throw new ForbiddenError("You don't have access to this list")
    }

    const rows = await db
      .select()
      .from(listMembers)
      .where(eq(listMembers.listId, listId))

    // Enrich with Clerk user data
    const client = await clerkClient()
    const enriched = await Promise.all(
      rows.map(async (row) => {
        try {
          const user = await client.users.getUser(row.userId)
          return {
            id: row.id,
            listId: row.listId,
            userId: row.userId,
            role: row.role as "owner" | "member",
            joinedAt: row.joinedAt.toISOString(),
            email: user.emailAddresses[0]?.emailAddress ?? null,
            name: user.firstName && user.lastName 
              ? `${user.firstName} ${user.lastName}` 
              : user.username ?? null,
            imageUrl: user.imageUrl,
          }
        } catch {
          return {
            id: row.id,
            listId: row.listId,
            userId: row.userId,
            role: row.role as "owner" | "member",
            joinedAt: row.joinedAt.toISOString(),
            email: null,
            name: null,
            imageUrl: null,
          }
        }
      })
    )

    return enriched
  },

  async remove(listId: string, memberUserId: string, requestingUserId: string): Promise<void> {
    // Verify requesting user is owner
    const ownerCheck = await db
      .select()
      .from(listMembers)
      .where(and(
        eq(listMembers.listId, listId),
        eq(listMembers.userId, requestingUserId),
        eq(listMembers.role, "owner")
      ))
      .limit(1)
    
    if (!ownerCheck[0]) {
      throw new ForbiddenError("Only owners can remove members")
    }

    // Cannot remove owner
    const targetMember = await db
      .select()
      .from(listMembers)
      .where(and(eq(listMembers.listId, listId), eq(listMembers.userId, memberUserId)))
      .limit(1)
    
    if (!targetMember[0]) {
      throw new NotFoundError("Member not found")
    }

    if (targetMember[0].role === "owner") {
      throw new ForbiddenError("Cannot remove list owner")
    }

    await db
      .delete(listMembers)
      .where(and(eq(listMembers.listId, listId), eq(listMembers.userId, memberUserId)))
  },

  async getUserRole(listId: string, userId: string): Promise<"owner" | "member" | null> {
    const rows = await db
      .select()
      .from(listMembers)
      .where(and(eq(listMembers.listId, listId), eq(listMembers.userId, userId)))
      .limit(1)
    
    return rows[0]?.role as "owner" | "member" | null
  },
}
```

**Dependencies:** Phase 1 complete
**Parallel:** Can develop alongside step 6

**Pattern Reference:** Similar to `/src/lib/services/lists.ts`

---

### 8. Update list-items service for shared lists
**File:** `/src/lib/services/list-items.ts`

**Changes Required:**
1. Replace `assertListOwnership` with `assertListAccess` (checks list_members instead of lists.userId)
2. Add `addedBy` tracking to create operations
3. Update delete to allow members to delete only their own items
4. Update DTO to include `addedBy` field

**Modified Functions:**
```typescript
// Replace assertListOwnership with:
const assertListAccess = async (listId: string, userId: string): Promise<"owner" | "member"> => {
  const rows = await db
    .select()
    .from(listMembers)
    .where(and(eq(listMembers.listId, listId), eq(listMembers.userId, userId)))
    .limit(1)
  
  if (!rows[0]) {
    throw new ForbiddenError("You don't have access to this list")
  }

  return rows[0].role as "owner" | "member"
}

// Update DTO:
export type ListItemDto = {
  // ... existing fields
  addedBy: string
}

// Update toListItemDto:
const toListItemDto = (item: ListItemRow): ListItemDto => ({
  // ... existing fields
  addedBy: item.addedBy,
})

// Update getAllByList:
async getAllByList(listId: string, userId: string): Promise<ListItemDto[]> {
  await assertListAccess(listId, userId) // Just need access, not ownership
  // ... rest unchanged
}

// Update create:
async create(listId: string, userId: string, data: CreateListItemInput): Promise<ListItemDto> {
  await assertListAccess(listId, userId)
  
  // ... existing duplicate check ...

  const rows = await db
    .insert(listItems)
    .values({
      // ... existing fields
      addedBy: userId, // NEW: Track who added this
    })
    .returning()

  return toListItemDto(rows[0])
}

// Update delete with permission check:
async delete(listId: string, itemId: string, userId: string): Promise<void> {
  const role = await assertListAccess(listId, userId)

  const existingItem = await db
    .select()
    .from(listItems)
    .where(and(eq(listItems.listId, listId), eq(listItems.id, itemId)))
    .limit(1)

  if (existingItem.length === 0) {
    throw new NotFoundError("Item not found")
  }

  // Members can only delete items they added
  if (role === "member" && existingItem[0].addedBy !== userId) {
    throw new ForbiddenError("You can only delete items you added")
  }

  // Owners can delete any item
  await db.delete(listItems).where(eq(listItems.id, itemId))
}
```

**Dependencies:** Phase 1 complete
**Parallel:** Can develop alongside steps 6 & 7

**Pattern Reference:** Extends existing `/src/lib/services/list-items.ts`

---

### 9. Update lists service for shared lists
**File:** `/src/lib/services/lists.ts`

**Changes Required:**
1. Update `getAllByUser` to return both owned and shared lists
2. Update authorization to check list_members table
3. Add list creation to automatically create owner record in list_members

**Modified Functions:**
```typescript
// Update getAllByUser to include shared lists:
async getAllByUser(userId: string): Promise<ListDto[]> {
  const rows = await db
    .select({ list: lists })
    .from(lists)
    .innerJoin(listMembers, eq(lists.id, listMembers.listId))
    .where(eq(listMembers.userId, userId))

  return rows.map(row => toListDto(row.list))
}

// Update create to add owner to list_members:
async create(userId: string, data: CreateListInput): Promise<ListDto> {
  const rows = await db
    .insert(lists)
    .values({
      name: data.name,
      description: data.description ?? null,
      userId,
    })
    .returning()

  const list = rows[0]

  // Add creator as owner in list_members
  await db.insert(listMembers).values({
    listId: list.id,
    userId,
    role: "owner",
  })

  return toListDto(list)
}

// Update authorization helper:
const getListWithRole = async (listId: string, userId: string) => {
  const listRows = await db.select().from(lists).where(eq(lists.id, listId)).limit(1)
  if (!listRows[0]) {
    throw new NotFoundError("List not found")
  }

  const memberRows = await db
    .select()
    .from(listMembers)
    .where(and(eq(listMembers.listId, listId), eq(listMembers.userId, userId)))
    .limit(1)
  
  if (!memberRows[0]) {
    throw new ForbiddenError("You don't have access to this list")
  }

  return { list: listRows[0], role: memberRows[0].role as "owner" | "member" }
}

// Update update method:
async update(listId: string, userId: string, data: UpdateListInput): Promise<ListDto> {
  const { list, role } = await getListWithRole(listId, userId)

  if (role !== "owner") {
    throw new ForbiddenError("Only owners can update list details")
  }

  // ... rest unchanged
}

// Update delete method:
async delete(listId: string, userId: string): Promise<void> {
  const { role } = await getListWithRole(listId, userId)

  if (role !== "owner") {
    throw new ForbiddenError("Only owners can delete lists")
  }

  await db.delete(lists).where(eq(lists.id, listId))
  // Cascades to list_members, list_items, invitations
}
```

**Dependencies:** Phase 1 complete
**Parallel:** Can develop alongside steps 6-8

---

### 10. Create invitation schemas
**File:** `/src/lib/schemas/invitations.schema.ts`

**Purpose:** Zod validation schemas for invitation operations.

```typescript
import { z } from "zod"

export const createInvitationSchema = z.object({
  inviteeEmail: z.string().email("Must be a valid email address"),
})

export const invitationParamsSchema = z.object({
  invitationId: z.uuid(),
})

export const respondToInvitationSchema = z.object({
  action: z.enum(["accept", "reject"]),
})
```

**Dependencies:** None
**Parallel:** Can do anytime in Phase 2

**Pattern Reference:** Matches `/src/lib/schemas/lists.schema.ts`

---

### 11. Create API route: POST /api/lists/[listId]/invitations
**File:** `/src/app/api/lists/[listId]/invitations/route.ts`

**Purpose:** Create a new invitation for a list.

```typescript
import { NextResponse } from "next/server"
import { requireUserId } from "@/lib/auth"
import { handleApiError } from "@/lib/errors"
import { createInvitationSchema } from "@/lib/schemas/invitations.schema"
import { invitationsService } from "@/lib/services/invitations"
import { listParamsSchema } from "@/lib/schemas/lists.schema"
import { clerkClient } from "@clerk/nextjs/server"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ listId: string }> }
) {
  try {
    const userId = await requireUserId()
    const { listId } = listParamsSchema.parse(await params)
    const body = createInvitationSchema.parse(await request.json())

    const invitation = await invitationsService.create(
      listId,
      userId,
      body.inviteeEmail
    )

    return NextResponse.json({ invitation }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ listId: string }> }
) {
  try {
    const userId = await requireUserId()
    const { listId } = listParamsSchema.parse(await params)

    const invitations = await invitationsService.getByList(listId, userId)

    return NextResponse.json({ invitations }, { status: 200 })
  } catch (error) {
    return handleApiError(error)
  }
}
```

**Dependencies:** Steps 6, 10
**Parallel:** Can develop alongside step 12

**Pattern Reference:** Matches `/src/app/api/lists/route.ts`

---

### 12. Create API route: GET /api/invitations
**File:** `/src/app/api/invitations/route.ts`

**Purpose:** Get pending invitations for current user.

```typescript
import { NextResponse } from "next/server"
import { requireUserId } from "@/lib/auth"
import { handleApiError } from "@/lib/errors"
import { invitationsService } from "@/lib/services/invitations"
import { clerkClient } from "@clerk/nextjs/server"

export async function GET() {
  try {
    const userId = await requireUserId()
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const userEmail = user.emailAddresses[0]?.emailAddress

    if (!userEmail) {
      return NextResponse.json(
        { message: "User email not found" },
        { status: 400 }
      )
    }

    const invitations = await invitationsService.getPendingByEmail(userEmail)

    return NextResponse.json({ invitations }, { status: 200 })
  } catch (error) {
    return handleApiError(error)
  }
}
```

**Dependencies:** Step 6, 10
**Parallel:** Can develop alongside step 11

---

### 13. Create API route: POST /api/invitations/[invitationId]/respond
**File:** `/src/app/api/invitations/[invitationId]/respond/route.ts`

**Purpose:** Accept or reject an invitation.

```typescript
import { NextResponse } from "next/server"
import { requireUserId } from "@/lib/auth"
import { handleApiError } from "@/lib/errors"
import { invitationsService } from "@/lib/services/invitations"
import { invitationParamsSchema, respondToInvitationSchema } from "@/lib/schemas/invitations.schema"
import { clerkClient } from "@clerk/nextjs/server"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ invitationId: string }> }
) {
  try {
    const userId = await requireUserId()
    const { invitationId } = invitationParamsSchema.parse(await params)
    const body = respondToInvitationSchema.parse(await request.json())

    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const userEmail = user.emailAddresses[0]?.emailAddress

    if (!userEmail) {
      return NextResponse.json(
        { message: "User email not found" },
        { status: 400 }
      )
    }

    if (body.action === "accept") {
      await invitationsService.accept(invitationId, userId, userEmail)
    } else {
      await invitationsService.reject(invitationId, userEmail)
    }

    return NextResponse.json(
      { message: `Invitation ${body.action}ed successfully` },
      { status: 200 }
    )
  } catch (error) {
    return handleApiError(error)
  }
}
```

**Dependencies:** Steps 6, 10
**Parallel:** Can develop alongside steps 11-12

---

### 14. Create API route: GET /api/lists/[listId]/members
**File:** `/src/app/api/lists/[listId]/members/route.ts`

**Purpose:** Get all members of a list.

```typescript
import { NextResponse } from "next/server"
import { requireUserId } from "@/lib/auth"
import { handleApiError } from "@/lib/errors"
import { listMembersService } from "@/lib/services/list-members"
import { listParamsSchema } from "@/lib/schemas/lists.schema"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ listId: string }> }
) {
  try {
    const userId = await requireUserId()
    const { listId } = listParamsSchema.parse(await params)

    const members = await listMembersService.getByList(listId, userId)

    return NextResponse.json({ members }, { status: 200 })
  } catch (error) {
    return handleApiError(error)
  }
}
```

**Dependencies:** Step 7
**Parallel:** Can develop alongside step 15

---

### 15. Create API route: DELETE /api/lists/[listId]/members/[userId]
**File:** `/src/app/api/lists/[listId]/members/[userId]/route.ts`

**Purpose:** Remove a member from a list (owner only).

```typescript
import { NextResponse } from "next/server"
import { requireUserId } from "@/lib/auth"
import { handleApiError } from "@/lib/errors"
import { listMembersService } from "@/lib/services/list-members"
import { listParamsSchema } from "@/lib/schemas/lists.schema"
import { z } from "zod"

const paramsSchema = z.object({
  listId: z.uuid(),
  userId: z.string(),
})

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ listId: string; userId: string }> }
) {
  try {
    const requestingUserId = await requireUserId()
    const { listId, userId: memberUserId } = paramsSchema.parse(await params)

    await listMembersService.remove(listId, memberUserId, requestingUserId)

    return NextResponse.json(
      { message: "Member removed successfully" },
      { status: 200 }
    )
  } catch (error) {
    return handleApiError(error)
  }
}
```

**Dependencies:** Step 7
**Parallel:** Can develop alongside step 14

---

## PHASE 3: Frontend Client Services & Hooks

### 16. Create invitation client service
**File:** `/src/services/api/invitations.ts`

**Purpose:** Client-side API wrapper for invitation operations.

```typescript
import { apiRequest } from "./request"

export type Invitation = {
  id: string
  listId: string
  listName: string
  inviterUserId: string
  inviteeEmail: string
  status: "pending" | "accepted" | "rejected"
  createdAt: string
  respondedAt: string | null
}

export type CreateInvitationInput = {
  inviteeEmail: string
}

export const apiInvitationsService = {
  async getPendingInvitations(): Promise<Invitation[]> {
    const response = await apiRequest<{ invitations: Invitation[] }>(
      "/api/invitations",
      { method: "GET" }
    )
    return response.invitations
  },

  async createInvitation(
    listId: string,
    input: CreateInvitationInput
  ): Promise<Invitation> {
    const response = await apiRequest<{ invitation: Invitation }>(
      `/api/lists/${listId}/invitations`,
      {
        method: "POST",
        body: JSON.stringify(input),
      }
    )
    return response.invitation
  },

  async respondToInvitation(
    invitationId: string,
    action: "accept" | "reject"
  ): Promise<void> {
    await apiRequest(
      `/api/invitations/${invitationId}/respond`,
      {
        method: "POST",
        body: JSON.stringify({ action }),
      }
    )
  },

  async getListInvitations(listId: string): Promise<Invitation[]> {
    const response = await apiRequest<{ invitations: Invitation[] }>(
      `/api/lists/${listId}/invitations`,
      { method: "GET" }
    )
    return response.invitations
  },
}
```

**Dependencies:** Phase 2 API routes complete
**Parallel:** Can develop alongside step 17

**Pattern Reference:** Matches `/src/services/api/lists.ts`

---

### 17. Create list-members client service
**File:** `/src/services/api/list-members.ts`

**Purpose:** Client-side API wrapper for list member operations.

```typescript
import { apiRequest } from "./request"

export type ListMember = {
  id: string
  listId: string
  userId: string
  role: "owner" | "member"
  joinedAt: string
  email: string | null
  name: string | null
  imageUrl: string | null
}

export const apiListMembersService = {
  async getListMembers(listId: string): Promise<ListMember[]> {
    const response = await apiRequest<{ members: ListMember[] }>(
      `/api/lists/${listId}/members`,
      { method: "GET" }
    )
    return response.members
  },

  async removeMember(listId: string, userId: string): Promise<void> {
    await apiRequest(
      `/api/lists/${listId}/members/${userId}`,
      { method: "DELETE" }
    )
  },
}
```

**Dependencies:** Phase 2 API routes complete
**Parallel:** Can develop alongside step 16

---

### 18. Create useInvitations hook
**File:** `/src/hooks/api/useInvitations.ts`

**Purpose:** React Query hooks for invitation operations.

```typescript
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  apiInvitationsService,
  type CreateInvitationInput,
} from "@/services/api/invitations"

export const apiInvitationsKeys = {
  all: ["api", "invitations"] as const,
  pending: () => ["api", "invitations", "pending"] as const,
  byList: (listId: string) => ["api", "invitations", "list", listId] as const,
}

export function usePendingInvitations() {
  return useQuery({
    queryKey: apiInvitationsKeys.pending(),
    queryFn: async () => {
      return apiInvitationsService.getPendingInvitations()
    },
    staleTime: 1000 * 60, // 1 minute
  })
}

export function useListInvitations(listId: string) {
  return useQuery({
    queryKey: apiInvitationsKeys.byList(listId),
    queryFn: async () => {
      return apiInvitationsService.getListInvitations(listId)
    },
    staleTime: 1000 * 60, // 1 minute
  })
}

export function useCreateInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      listId,
      input,
    }: {
      listId: string
      input: CreateInvitationInput
    }) => {
      return apiInvitationsService.createInvitation(listId, input)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: apiInvitationsKeys.byList(variables.listId),
      })
      toast.success("Invitation sent successfully!")
    },
    onError: (error: Error) => {
      toast.error(`Failed to send invitation: ${error.message}`)
    },
  })
}

export function useRespondToInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      invitationId,
      action,
    }: {
      invitationId: string
      action: "accept" | "reject"
    }) => {
      return apiInvitationsService.respondToInvitation(invitationId, action)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: apiInvitationsKeys.pending(),
      })
      queryClient.invalidateQueries({
        queryKey: ["api", "lists"], // Refresh lists if accepted
      })
      const message =
        variables.action === "accept"
          ? "Invitation accepted! List added to your collection."
          : "Invitation declined."
      toast.success(message)
    },
    onError: (error: Error) => {
      toast.error(`Failed to respond to invitation: ${error.message}`)
    },
  })
}
```

**Dependencies:** Step 16
**Parallel:** Can develop alongside step 19

**Pattern Reference:** Matches `/src/hooks/api/useLists.ts`

---

### 19. Create useListMembers hook
**File:** `/src/hooks/api/useListMembers.ts`

**Purpose:** React Query hooks for list member operations.

```typescript
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { apiListMembersService } from "@/services/api/list-members"

export const apiListMembersKeys = {
  all: ["api", "list-members"] as const,
  byList: (listId: string) => ["api", "list-members", listId] as const,
}

export function useListMembers(listId: string) {
  return useQuery({
    queryKey: apiListMembersKeys.byList(listId),
    queryFn: async () => {
      return apiListMembersService.getListMembers(listId)
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

export function useRemoveListMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      listId,
      userId,
    }: {
      listId: string
      userId: string
    }) => {
      return apiListMembersService.removeMember(listId, userId)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: apiListMembersKeys.byList(variables.listId),
      })
      toast.success("Member removed from list")
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove member: ${error.message}`)
    },
  })
}
```

**Dependencies:** Step 17
**Parallel:** Can develop alongside step 18

---

### 20. Update useListItems hook
**File:** `/src/hooks/api/useListItems.ts`

**Changes:** Update types to include `addedBy` field, add permission checking logic.

```typescript
// Update ListItem type:
export type ListItem = {
  // ... existing fields
  addedBy: string
}

// Add permission helper:
export function useCanDeleteItem(item: ListItem, userRole: "owner" | "member", userId: string) {
  if (userRole === "owner") return true
  return item.addedBy === userId
}
```

**Dependencies:** Phase 2 backend updates
**Parallel:** Can develop alongside steps 18-19

---

### 21. Create permission utility helpers
**File:** `/src/lib/utils/permissions.ts`

**Purpose:** Client-side permission checking utilities.

```typescript
export type UserRole = "owner" | "member" | null

export const permissions = {
  canUpdateList(role: UserRole): boolean {
    return role === "owner"
  },

  canDeleteList(role: UserRole): boolean {
    return role === "owner"
  },

  canInviteMembers(role: UserRole): boolean {
    return role === "owner"
  },

  canRemoveMembers(role: UserRole): boolean {
    return role === "owner"
  },

  canAddItems(role: UserRole): boolean {
    return role === "owner" || role === "member"
  },

  canDeleteItem(role: UserRole, itemAddedBy: string, currentUserId: string): boolean {
    if (role === "owner") return true
    if (role === "member") return itemAddedBy === currentUserId
    return false
  },
}
```

**Dependencies:** None
**Parallel:** Can do anytime in Phase 3

---

## PHASE 4: UI Components

### 22. Create ShareListDialog component
**File:** `/src/components/share-list-dialog.tsx`

**Purpose:** Modal dialog for owners to invite users by email.

**Features:**
- Email input field with validation
- Submit button to send invitation
- Loading state during Clerk email validation
- Error handling (email not found, user already member, etc.)
- Success feedback

**Implementation:**
```typescript
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCreateInvitation } from "@/hooks/api/useInvitations"
import { Share2 } from "lucide-react"

const inviteSchema = z.object({
  email: z.string().email("Must be a valid email address"),
})

type InviteFormData = z.infer<typeof inviteSchema>

interface ShareListDialogProps {
  listId: string
  listName: string
}

export function ShareListDialog({ listId, listName }: ShareListDialogProps) {
  const [open, setOpen] = useState(false)
  const createInvitation = useCreateInvitation()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
  })

  const onSubmit = async (data: InviteFormData) => {
    await createInvitation.mutateAsync({
      listId,
      input: { inviteeEmail: data.email },
    })
    reset()
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share "{listName}"</DialogTitle>
          <DialogDescription>
            Enter the email address of the user you want to invite. They must
            have an account to receive the invitation.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createInvitation.isPending}>
              {createInvitation.isPending ? "Sending..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

**Dependencies:** Steps 18, shadcn/ui components
**Parallel:** Can develop alongside steps 23-25

**Pattern Reference:** Similar to `/src/components/create-list-dialog.tsx`

---

### 23. Create PendingInvitations component
**File:** `/src/components/pending-invitations.tsx`

**Purpose:** Display pending invitations with accept/reject actions.

**Features:**
- List of pending invitations
- Show list name and inviter
- Accept/Reject buttons
- Empty state when no invitations
- Loading state

**Implementation:**
```typescript
"use client"

import { usePendingInvitations, useRespondToInvitation } from "@/hooks/api/useInvitations"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, X, Mail } from "lucide-react"

export function PendingInvitations() {
  const { data: invitations, isLoading } = usePendingInvitations()
  const respondToInvitation = useRespondToInvitation()

  if (isLoading) {
    return <div className="text-muted-foreground">Loading invitations...</div>
  }

  if (!invitations || invitations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Pending Invitations
          </CardTitle>
          <CardDescription>
            You don't have any pending list invitations
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Pending Invitations ({invitations.length})
        </CardTitle>
        <CardDescription>
          Lists that have been shared with you
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {invitations.map((invitation) => (
            <div
              key={invitation.id}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div>
                <h3 className="font-medium">{invitation.listName}</h3>
                <p className="text-sm text-muted-foreground">
                  Invited on {new Date(invitation.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    respondToInvitation.mutate({
                      invitationId: invitation.id,
                      action: "reject",
                    })
                  }
                  disabled={respondToInvitation.isPending}
                >
                  <X className="mr-1 h-4 w-4" />
                  Decline
                </Button>
                <Button
                  size="sm"
                  onClick={() =>
                    respondToInvitation.mutate({
                      invitationId: invitation.id,
                      action: "accept",
                    })
                  }
                  disabled={respondToInvitation.isPending}
                >
                  <Check className="mr-1 h-4 w-4" />
                  Accept
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
```

**Dependencies:** Step 18
**Parallel:** Can develop alongside steps 22, 24-25

---

### 24. Create ListMembers component
**File:** `/src/components/list-members.tsx`

**Purpose:** Display list members with remove action for owners.

**Features:**
- Avatar + name/email for each member
- Role badge (Owner/Member)
- Remove button (owners only, cannot remove self)
- Loading state

**Implementation:**
```typescript
"use client"

import { useListMembers, useRemoveListMember } from "@/hooks/api/useListMembers"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UserMinus, Users } from "lucide-react"
import { useUser } from "@clerk/nextjs"

interface ListMembersProps {
  listId: string
  userRole: "owner" | "member" | null
}

export function ListMembers({ listId, userRole }: ListMembersProps) {
  const { user } = useUser()
  const { data: members, isLoading } = useListMembers(listId)
  const removeMember = useRemoveListMember()

  if (isLoading) {
    return <div className="text-muted-foreground">Loading members...</div>
  }

  if (!members || members.length === 0) {
    return null
  }

  const canRemoveMembers = userRole === "owner"

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Members ({members.length})
        </CardTitle>
        <CardDescription>
          People who have access to this list
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {members.map((member) => {
            const isCurrentUser = member.userId === user?.id
            const canRemove = canRemoveMembers && !isCurrentUser && member.role !== "owner"

            return (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={member.imageUrl ?? undefined} />
                    <AvatarFallback>
                      {member.name?.[0]?.toUpperCase() ?? member.email?.[0]?.toUpperCase() ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {member.name ?? member.email ?? "Unknown User"}
                      {isCurrentUser && (
                        <span className="ml-2 text-sm text-muted-foreground">(You)</span>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Joined {new Date(member.joinedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={member.role === "owner" ? "default" : "secondary"}>
                    {member.role === "owner" ? "Owner" : "Member"}
                  </Badge>
                  {canRemove && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        removeMember.mutate({
                          listId,
                          userId: member.userId,
                        })
                      }
                      disabled={removeMember.isPending}
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
```

**Dependencies:** Step 19, shadcn/ui components
**Parallel:** Can develop alongside steps 22-23, 25

---

### 25. Update ListCard component
**File:** `/src/components/list-card.tsx`

**Changes:**
- Add visual indicator for shared lists (e.g., Users icon)
- Show member count for shared lists
- Display role badge (Owner/Member)

**Additions:**
```typescript
import { Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"

// Add to component props:
interface ListCardProps {
  // ... existing props
  isShared?: boolean
  memberCount?: number
  userRole?: "owner" | "member"
}

// Add to card rendering:
{isShared && (
  <div className="flex items-center gap-2 text-sm text-muted-foreground">
    <Users className="h-4 w-4" />
    {memberCount} {memberCount === 1 ? "member" : "members"}
  </div>
)}

{userRole && (
  <Badge variant={userRole === "owner" ? "default" : "secondary"}>
    {userRole}
  </Badge>
)}
```

**Dependencies:** Existing list-card component
**Parallel:** Can develop alongside steps 22-24

---

### 26. Update ListPage component
**File:** `/src/app/list/[id]/page.tsx`

**Changes:**
- Fetch user's role for the list
- Conditionally render ShareListDialog (owners only)
- Render ListMembers component
- Show/hide edit/delete buttons based on role
- Update item delete button logic (check permissions)

**Key Additions:**
```typescript
import { useListMembers } from "@/hooks/api/useListMembers"
import { ShareListDialog } from "@/components/share-list-dialog"
import { ListMembers } from "@/components/list-members"
import { permissions } from "@/lib/utils/permissions"
import { useUser } from "@clerk/nextjs"

// In component:
const { user } = useUser()
const { data: members } = useListMembers(listId)

const userRole = members?.find(m => m.userId === user?.id)?.role ?? null

// Conditional rendering:
{permissions.canInviteMembers(userRole) && (
  <ShareListDialog listId={listId} listName={listName} />
)}

{permissions.canUpdateList(userRole) && (
  <Button onClick={handleEdit}>Edit List</Button>
)}

{permissions.canDeleteList(userRole) && (
  <Button onClick={handleDelete}>Delete List</Button>
)}

<ListMembers listId={listId} userRole={userRole} />

// For each list item:
{permissions.canDeleteItem(userRole, item.addedBy, user?.id ?? "") && (
  <Button onClick={() => handleDeleteItem(item.id)}>Remove</Button>
)}
```

**Dependencies:** Steps 22, 24, Phase 3 hooks
**Parallel:** Final integration step in Phase 4

---

## PHASE 5: Pages & Navigation

### 27. Update Lists page with sections
**File:** `/src/app/lists/page.tsx`

**Changes:**
- Separate lists into "My Lists" (owner) and "Shared with Me" (member)
- Add PendingInvitations component at top
- Update useApiLists to include role information
- Visual distinction between owned and shared lists

**Implementation Structure:**
```typescript
import { PendingInvitations } from "@/components/pending-invitations"
import { useApiLists } from "@/hooks/api/useLists"
import { useListMembers } from "@/hooks/api/useListMembers"
import { useUser } from "@clerk/nextjs"

export default function ListsPage() {
  const { user } = useUser()
  const { data: lists } = useApiLists()

  // Categorize lists by checking list_members role
  const myLists = lists?.filter(/* owner check */)
  const sharedLists = lists?.filter(/* member check */)

  return (
    <div className="space-y-8">
      <PendingInvitations />

      <section>
        <h2>My Lists ({myLists?.length ?? 0})</h2>
        {/* Render myLists */}
      </section>

      <section>
        <h2>Shared with Me ({sharedLists?.length ?? 0})</h2>
        {/* Render sharedLists */}
      </section>
    </div>
  )
}
```

**Note:** May need to enhance `/src/services/api/lists.ts` to include role in list response, or fetch members for each list.

**Dependencies:** Steps 23, 25, Phase 3 hooks
**Parallel:** Can develop alongside step 28

---

### 28. Update navigation (if needed)
**File:** `/src/components/navbar.tsx` or similar

**Changes:**
- Add badge showing pending invitation count
- Link to lists page or invitations section

**Optional Enhancement:**
```typescript
import { usePendingInvitations } from "@/hooks/api/useInvitations"

const { data: invitations } = usePendingInvitations()
const pendingCount = invitations?.length ?? 0

// In nav:
<Link href="/lists">
  Lists
  {pendingCount > 0 && <Badge>{pendingCount}</Badge>}
</Link>
```

**Dependencies:** Step 18 (usePendingInvitations)
**Parallel:** Can develop alongside step 27

---

## PHASE 6: Integration & Polish

### 29. Add toast notifications
**File:** Throughout components

**Implementation:**
- Success: "Invitation sent!", "Invitation accepted!", "Member removed"
- Error: API error messages
- Info: "Invitation declined"

**Already using:** `sonner` toast library (see existing hooks)

**Verification:** All mutation hooks already include toast notifications (Steps 18-19)

**Dependencies:** None - already implemented in hooks
**Parallel:** Review and ensure consistent messaging

---

### 30. Add loading and error states
**Files:** All components created in Phase 4

**Implementation:**
- Skeleton loaders for list members, invitations
- Error boundaries for API failures
- Retry buttons for failed requests
- Empty states with helpful CTAs

**Pattern Reference:** Existing skeleton components in `/src/components/skeletons/`

**Dependencies:** All Phase 4 components
**Parallel:** Add incrementally to each component

---

### 31. Handle edge cases
**Scenarios to address:**

1. **User deletes account (Clerk):**
   - FK constraint: `list_members.user_id` and `invitations.inviter_user_id` are TEXT (no FK to Clerk)
   - Decision: Keep records, show "Unknown User" if Clerk lookup fails (already handled in step 7)

2. **Invitation expires:**
   - Not currently implemented
   - Consider: Add `expires_at` column, cron job to cleanup, or handle on-read

3. **User tries to accept already-accepted invitation:**
   - Already handled: Service checks status === 'pending' (step 6)

4. **Last owner removed (should not happen):**
   - Already prevented: Cannot remove owner role (step 7)

5. **Duplicate invitations:**
   - Already handled: UNIQUE constraint on (list_id, invitee_email) (step 1)

6. **Owner leaves their own list:**
   - Not allowed: Cannot remove owner (step 7)
   - Consider: Transfer ownership feature (future enhancement)

7. **Concurrent invitation acceptance:**
   - Already handled: Transaction + UNIQUE constraint on list_members

**Dependencies:** All phases
**Parallel:** Test throughout implementation

---

### 32. Add confirmation dialogs
**Files:** Components with destructive actions

**Implementation:**
- Confirm before removing member
- Confirm before declining invitation
- Confirm before deleting shared list (warn about removing all members)

**Example:**
```typescript
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// Usage in ListMembers component:
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="ghost" size="sm">
      <UserMinus className="h-4 w-4" />
    </Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Remove member?</AlertDialogTitle>
      <AlertDialogDescription>
        This will revoke {member.name}'s access to this list.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={() => handleRemove(member.userId)}>
        Remove
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**Dependencies:** shadcn/ui AlertDialog component
**Parallel:** Add to components in Phase 4

---

## Relevant Files

### Files to Create

**Database & Migrations:**
- `/src/db/migrations/XXXX_add_shared_lists.sql` - All schema changes

**Services:**
- `/src/lib/services/invitations.ts` - Invitation business logic
- `/src/lib/services/list-members.ts` - Member management logic

**Schemas:**
- `/src/lib/schemas/invitations.schema.ts` - Zod validation for invitations

**API Routes:**
- `/src/app/api/invitations/route.ts` - GET pending invitations
- `/src/app/api/invitations/[invitationId]/respond/route.ts` - Accept/reject
- `/src/app/api/lists/[listId]/invitations/route.ts` - Create & list invitations
- `/src/app/api/lists/[listId]/members/route.ts` - List members
- `/src/app/api/lists/[listId]/members/[userId]/route.ts` - Remove member

**Client Services:**
- `/src/services/api/invitations.ts` - Client API wrapper
- `/src/services/api/list-members.ts` - Client API wrapper

**Hooks:**
- `/src/hooks/api/useInvitations.ts` - React Query hooks
- `/src/hooks/api/useListMembers.ts` - React Query hooks

**Components:**
- `/src/components/share-list-dialog.tsx` - Share list dialog
- `/src/components/pending-invitations.tsx` - Invitations list
- `/src/components/list-members.tsx` - Members list with management

**Utilities:**
- `/src/lib/utils/permissions.ts` - Permission helpers

### Files to Modify

**Database Schema:**
- `/src/db/schema.ts` - Add invitations, listMembers, update listItems

**Services:**
- `/src/lib/services/lists.ts` - Update to use list_members for auth
- `/src/lib/services/list-items.ts` - Add addedBy tracking, update permissions

**Components:**
- `/src/components/list-card.tsx` - Add shared indicators
- `/src/app/list/[id]/page.tsx` - Add sharing UI, permission checks
- `/src/app/lists/page.tsx` - Separate My Lists / Shared sections

**Hooks:**
- `/src/hooks/api/useListItems.ts` - Update types for addedBy

**Optional:**
- `/src/components/navbar.tsx` - Invitation count badge

---

## Verification Steps

### Phase 1 Verification
1. Run migrations successfully
2. Check database schema:
   ```sql
   \d invitations
   \d list_members
   \d list_items
   ```
3. Verify indexes exist
4. Confirm existing lists have owner records in `list_members`

### Phase 2 Verification
1. Test API endpoints with curl/Postman:
   ```bash
   # Create invitation
   POST /api/lists/{listId}/invitations
   {"inviteeEmail": "test@example.com"}

   # Get pending invitations
   GET /api/invitations

   # Accept invitation
   POST /api/invitations/{id}/respond
   {"action": "accept"}

   # List members
   GET /api/lists/{listId}/members

   # Remove member
   DELETE /api/lists/{listId}/members/{userId}
   ```
2. Verify Clerk email validation works
3. Verify permission checks (403 for non-owners trying to invite)
4. Verify unique constraints (409 for duplicate invitations)

### Phase 3 Verification
1. Check React Query devtools for correct cache keys
2. Verify hooks invalidate queries correctly
3. Test error handling with network failures
4. Verify toast notifications appear

### Phase 4 Verification
1. Test ShareListDialog:
   - Enter valid email → success
   - Enter non-existent email → error shown
   - Enter already-member email → error shown
2. Test PendingInvitations:
   - Accept invitation → list appears in "Shared with Me"
   - Decline invitation → invitation removed from list
3. Test ListMembers:
   - Owner sees remove buttons for members
   - Members don't see remove buttons
   - Cannot remove owner
4. Test ListCard shows correct badges and member count

### Phase 5 Verification
1. Navigate to /lists → see "My Lists" and "Shared with Me" sections
2. Pending invitations appear at top
3. Accept invitation → list moves to "Shared with Me"
4. Navbar shows invitation count badge (if implemented)

### Phase 6 Verification
1. Test all edge cases:
   - Duplicate invitation attempt → error
   - Non-existent email → error
   - Accept already-accepted invitation → error
   - Remove member as non-owner → 403
2. Verify all confirmation dialogs work
3. Check loading states during API calls
4. Verify error messages are user-friendly
5. Test permission-based UI:
   - Owner sees: Share, Edit, Delete, Remove Members
   - Member sees: Add Items, Remove Own Items only

### End-to-End Verification
**Scenario 1: Owner invites member**
1. User A creates list "Sci-Fi Movies"
2. User A clicks "Share", enters User B's email
3. User B logs in, sees pending invitation
4. User B accepts invitation
5. User B sees list in "Shared with Me"
6. User B adds item to list
7. User B can delete own item
8. User B cannot delete User A's items
9. User A can delete any item
10. User A removes User B from list
11. User B no longer sees list

**Scenario 2: Member permissions**
1. User A shares list with User B (member)
2. User B tries to share list → no "Share" button
3. User B tries to edit list details → no "Edit" button
4. User B tries to delete list → no "Delete" button
5. User B adds item → success
6. User B removes own item → success
7. User B tries to remove User A's item → no delete button shown

---

## Decisions

1. **No email sending (in-app only):**
   - Rationale: Simplifies infrastructure, avoids SMTP setup, keeps users in app
   - Trade-off: Users must log in to see invitations

2. **Login required for all features:**
   - Rationale: Clerk handles all auth, no anonymous/public sharing
   - Trade-off: Cannot share with non-users

3. **Two-level permissions (owner/member):**
   - Rationale: Simple model, covers main use cases
   - Trade-off: No granular permissions (e.g., "can invite" separate from "can edit")

4. **Members can only delete their own items:**
   - Rationale: Prevents accidental/malicious deletion by members
   - Trade-off: Owners may need to clean up after members

5. **Invitation must be accepted (no auto-join):**
   - Rationale: Gives users control, prevents spam
   - Trade-off: Extra step for collaboration

6. **Email validation via Clerk API:**
   - Rationale: Ensures invitee exists before creating invitation
   - Trade-off: API call overhead, coupled to Clerk

7. **Keep `lists.userId` column:**
   - Rationale: Backwards compatibility, simple owner lookup
   - Alternative: Could remove and rely solely on list_members with role='owner'

8. **Junction table `list_members` instead of array column:**
   - Rationale: Relational model, easier queries, proper indexes
   - Trade-off: More complex queries (JOINs)

9. **Soft-delete invitations (update status) vs hard-delete:**
   - Decision: Soft-delete (status: rejected)
   - Rationale: Audit trail, can show history to owner

10. **Store invitee email instead of userId in invitations:**
    - Rationale: User might not exist at invitation time (future), email is immutable in Clerk
    - Trade-off: Must lookup userId when accepting

---

## Further Considerations

### Should invitations expire after X days?
- **Pros:** Prevents stale invitations, security (revoked access)
- **Cons:** Extra complexity (cron job or on-read check)
- **Recommendation:** Implement later as enhancement
  - Add `expires_at TIMESTAMP` column
  - Set default 30 days
  - Filter expired in `getPendingByEmail`
  - Show "Expired" badge in UI

### Should owners receive notifications when invitees accept?
- **Pros:** Owner awareness, engagement
- **Cons:** Extra complexity (notification system)
- **Recommendation:** Future enhancement
  - Add `notifications` table
  - Create notification when invitation accepted
  - Show in navbar dropdown
  - Mark as read

### Should there be a limit on list members?
- **Pros:** Prevent abuse, performance
- **Cons:** May frustrate legitimate use cases
- **Recommendation:** Start without limit, add later if needed
  - Monitor member counts in production
  - Add limit (e.g., 50) if abuse detected
  - Check in `invitationsService.create`

### Should lists support multiple owners?
- **Pros:** Shared responsibility, no single point of failure
- **Cons:** Complexity in UI, potential conflicts
- **Recommendation:** Future enhancement
  - Add "Promote to Owner" action
  - Allow multiple role='owner' records
  - Update permission logic to check role, not specific user

### Should members be able to leave lists themselves?
- **Pros:** User autonomy, less burden on owners
- **Cons:** Extra UI, edge case handling
- **Recommendation:** Implement in Phase 6
  - Add "Leave List" button for members
  - API: `DELETE /api/lists/{listId}/members/me`
  - Service: Allow self-removal if role='member'

### Should the system support list visibility levels (private/public)?
- **Current:** All lists are private (invitation-only)
- **Future:** Public lists discoverable by anyone
- **Recommendation:** Out of scope for this iteration
  - Would require: `lists.visibility` column, public gallery page, search

### Should list items support comments/notes?
- **Use case:** Members discuss movies
- **Recommendation:** Separate feature, not part of sharing MVP
  - Would require: `list_item_comments` table, real-time sync

### Should the system track item history (who added, who removed)?
- **Current:** Only tracks `addedBy`
- **Enhancement:** Full audit log
- **Recommendation:** Future enhancement
  - Add `list_item_history` table
  - Track: action (added/removed), userId, timestamp
  - Show in UI: "Added by X on Y, Removed by Z on W"

### Performance considerations
- **Concern:** N+1 queries when enriching members with Clerk data
- **Current:** `Promise.all` in `listMembersService.getByList` (step 7)
- **Optimization:** Cache Clerk user data in database
  - Add `users` table syncing Clerk webhook
  - Reduces API calls, improves performance
  - Requires: Webhook handler, sync logic

### Testing strategy
- **Unit tests:** Services with mocked DB
- **Integration tests:** API routes with test database
- **E2E tests:** Playwright for user flows
- **Recommendation:** Add tests incrementally per phase
  - Phase 2: Service unit tests
  - Phase 2: API integration tests
  - Phase 6: E2E critical flows

---

## Implementation Timeline Estimate

**Assumptions:**
- 1 developer
- Existing codebase knowledge
- No blockers (Clerk API works, DB accessible)

**Phase 1:** 4-6 hours
- Migrations: 2 hours
- Schema updates: 1 hour
- Testing/verification: 1-2 hours

**Phase 2:** 12-16 hours
- Services: 6-8 hours (3 services)
- API routes: 4-6 hours (5 routes)
- Testing: 2 hours

**Phase 3:** 6-8 hours
- Client services: 2 hours
- Hooks: 3-4 hours
- Utilities: 1 hour
- Testing: 1 hour

**Phase 4:** 10-12 hours
- ShareListDialog: 2-3 hours
- PendingInvitations: 2-3 hours
- ListMembers: 2-3 hours
- Component updates: 2-3 hours
- Testing: 2 hours

**Phase 5:** 4-6 hours
- Lists page refactor: 2-3 hours
- Navigation updates: 1 hour
- Testing: 1-2 hours

**Phase 6:** 8-10 hours
- Edge cases: 3-4 hours
- Confirmation dialogs: 2-3 hours
- Loading/error states: 2-3 hours
- Polish & final testing: 1-2 hours

**Total:** 44-58 hours (~6-8 days for single developer)

**Parallelization opportunities:**
- Phase 2: Services can be developed independently
- Phase 4: Components can be developed independently
- Phases 2-3 can overlap (start Phase 3 when Phase 2 services are done)

---

## Dependency Graph

```
Phase 1 (DB Schema)
└─> Phase 2 (Backend)
    ├─> Phase 3 (Hooks & Client)
    │   └─> Phase 4 (Components)
    │       └─> Phase 5 (Pages)
    │           └─> Phase 6 (Polish)
    └─> Direct to Phase 6 (Edge cases testing)

Parallel Tasks:
- P1: Steps 1, 2, 3 can run together
- P2: Steps 6, 7, 8, 9 can run together (services)
- P2: Steps 11-15 can run together (API routes after services)
- P3: Steps 16, 17 can run together
- P3: Steps 18, 19, 20 can run together (after 16, 17)
- P4: Steps 22, 23, 24 can run together
```

---

## Rollout Strategy

**Option 1: Big Bang (all at once)**
- Deploy all phases together
- Higher risk, easier rollback

**Option 2: Phased Rollout**
1. Deploy Phase 1-2 (backend only, no UI)
   - Verify migrations work
   - Test APIs directly
2. Deploy Phase 3-4 (add UI)
   - Feature flag: `ENABLE_LIST_SHARING=true`
   - Roll out to 10% of users
3. Monitor errors, performance
4. Full rollout to 100%
5. Deploy Phase 5-6 (polish)

**Recommendation:** Phased rollout with feature flag

**Feature Flag Implementation:**
```typescript
// /src/lib/feature-flags.ts
export const featureFlags = {
  listSharing: process.env.NEXT_PUBLIC_ENABLE_LIST_SHARING === "true",
}

// In components:
import { featureFlags } from "@/lib/feature-flags"

{featureFlags.listSharing && <ShareListDialog />}
```

---

## Monitoring & Observability

**Metrics to track:**
1. Invitation creation rate
2. Invitation acceptance rate (accepted / total sent)
3. Average time to accept invitation
4. Number of shared lists vs total lists
5. Average members per shared list
6. API error rates per endpoint
7. Clerk API call volume (rate limiting?)

**Logging:**
- Log all invitation actions (create, accept, reject)
- Log member additions/removals
- Log permission errors (403s) - may indicate UI bugs

**Alerts:**
- Spike in 403 errors (permission bugs)
- Spike in 409 errors (duplicate invitations)
- High Clerk API error rate
- Zero invitations accepted (feature not used)

---

**END OF PLAN**
