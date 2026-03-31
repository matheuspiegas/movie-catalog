import "server-only"
import type { InferSelectModel } from "drizzle-orm"
import { and, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { listMembers, lists } from "@/db/schema"
import { ForbiddenError, NotFoundError } from "@/lib/errors"

export type ListMemberDto = {
  id: string
  listId: string
  userId: string
  role: "owner" | "member"
  joinedAt: string
}

type ListMemberRow = InferSelectModel<typeof listMembers>

const toListMemberDto = (row: ListMemberRow): ListMemberDto => ({
  id: row.id,
  listId: row.listId,
  userId: row.userId,
  role: row.role as "owner" | "member",
  joinedAt: row.joinedAt.toISOString(),
})

export const listMembersService = {
  async getByListId(listId: string): Promise<ListMemberDto[]> {
    const rows = await db
      .select()
      .from(listMembers)
      .where(eq(listMembers.listId, listId))

    return rows.map(toListMemberDto)
  },

  async checkPermission(listId: string, userId: string): Promise<{ isOwner: boolean; isMember: boolean; role: "owner" | "member" | null }> {
    const rows = await db
      .select()
      .from(listMembers)
      .where(and(eq(listMembers.listId, listId), eq(listMembers.userId, userId)))
      .limit(1)

    const member = rows[0]
    if (!member) {
      return { isOwner: false, isMember: false, role: null }
    }

    const role = member.role as "owner" | "member"
    return {
      isOwner: role === "owner",
      isMember: true,
      role,
    }
  },

  async removeMember(listId: string, memberUserId: string, requestingUserId: string): Promise<void> {
    // 1. Verify list exists
    const listRows = await db.select().from(lists).where(eq(lists.id, listId)).limit(1)
    if (!listRows[0]) {
      throw new NotFoundError("List not found")
    }

    // 2. Verify requesting user is owner
    const requesterRows = await db
      .select()
      .from(listMembers)
      .where(and(eq(listMembers.listId, listId), eq(listMembers.userId, requestingUserId)))
      .limit(1)

    if (!requesterRows[0] || requesterRows[0].role !== "owner") {
      throw new ForbiddenError("Only list owners can remove members")
    }

    // 3. Prevent removing the owner
    const memberRows = await db
      .select()
      .from(listMembers)
      .where(and(eq(listMembers.listId, listId), eq(listMembers.userId, memberUserId)))
      .limit(1)

    if (!memberRows[0]) {
      throw new NotFoundError("Member not found")
    }

    if (memberRows[0].role === "owner") {
      throw new ForbiddenError("Cannot remove the list owner")
    }

    // 4. Remove the member
    await db
      .delete(listMembers)
      .where(and(eq(listMembers.listId, listId), eq(listMembers.userId, memberUserId)))
  },

  async getUserListIds(userId: string): Promise<string[]> {
    const rows = await db
      .select({ listId: listMembers.listId })
      .from(listMembers)
      .where(eq(listMembers.userId, userId))

    return rows.map(row => row.listId)
  },
}
