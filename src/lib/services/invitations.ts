import "server-only"
import { clerkClient } from "@clerk/nextjs/server"
import type { InferSelectModel } from "drizzle-orm"
import { and, eq } from "drizzle-orm"
import { invitations, listMembers, lists } from "@/db/schema"
import { db } from "@/lib/db"
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/lib/errors"

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

type InvitationRow = InferSelectModel<typeof invitations>

const toInvitationDto = (
  row: InvitationRow,
  listName?: string,
): InvitationDto => ({
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
  async create(
    listId: string,
    inviterUserId: string,
    inviteeEmail: string,
  ): Promise<InvitationDto> {
    // 1. Verify list exists and inviter is owner
    const listRows = await db
      .select()
      .from(lists)
      .where(eq(lists.id, listId))
      .limit(1)
    const list = listRows[0]
    if (!list) throw new NotFoundError("Lista nao encontrada")

    const memberRows = await db
      .select()
      .from(listMembers)
      .where(
        and(
          eq(listMembers.listId, listId),
          eq(listMembers.userId, inviterUserId),
        ),
      )
      .limit(1)

    if (!memberRows[0] || memberRows[0].role !== "owner") {
      throw new ForbiddenError("Apenas o dono da lista pode convidar membros")
    }

    // 2. Validate invitee email exists in Clerk
    const client = await clerkClient()
    const clerkUsers = await client.users.getUserList({
      emailAddress: [inviteeEmail],
    })
    if (clerkUsers.totalCount === 0) {
      throw new ValidationError("Nenhum usuario encontrado com este e-mail")
    }
    const inviteeUserId = clerkUsers.data[0].id

    // 3. Check if user is already a member
    const existingMember = await db
      .select()
      .from(listMembers)
      .where(
        and(
          eq(listMembers.listId, listId),
          eq(listMembers.userId, inviteeUserId),
        ),
      )
      .limit(1)

    if (existingMember[0]) {
      throw new ConflictError("Este usuario ja faz parte da lista")
    }

    // 4. Check for existing pending invitation
    const existingInvite = await db
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.listId, listId),
          eq(invitations.inviteeEmail, inviteeEmail),
        ),
      )
      .limit(1)

    if (existingInvite[0] && existingInvite[0].status === "pending") {
      throw new ConflictError("Ja existe um convite pendente para este usuario")
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
      .where(
        and(
          eq(invitations.inviteeEmail, email),
          eq(invitations.status, "pending"),
        ),
      )

    return rows.map((row) => toInvitationDto(row.invitation, row.list.name))
  },

  async accept(
    invitationId: string,
    userId: string,
    userEmail: string,
    userName: string,
  ): Promise<void> {
    const rows = await db
      .select()
      .from(invitations)
      .where(eq(invitations.id, invitationId))
      .limit(1)

    const invitation = rows[0]
    if (!invitation) throw new NotFoundError("Convite nao encontrado")
    if (invitation.inviteeEmail !== userEmail) {
      throw new ForbiddenError("Este convite nao pertence a voce")
    }
    if (invitation.status !== "pending") {
      throw new ConflictError("Este convite ja foi respondido")
    }

    // Add user as member
    await db.insert(listMembers).values({
      listId: invitation.listId,
      userId,
      userName,
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
    if (!invitation) throw new NotFoundError("Convite nao encontrado")
    if (invitation.inviteeEmail !== userEmail) {
      throw new ForbiddenError("Este convite nao pertence a voce")
    }
    if (invitation.status !== "pending") {
      throw new ConflictError("Este convite ja foi respondido")
    }

    // Update invitation status
    await db
      .update(invitations)
      .set({ status: "rejected", respondedAt: new Date() })
      .where(eq(invitations.id, invitationId))
  },

  async getById(invitationId: string): Promise<InvitationDto | null> {
    const rows = await db
      .select({
        invitation: invitations,
        list: lists,
      })
      .from(invitations)
      .innerJoin(lists, eq(invitations.listId, lists.id))
      .where(eq(invitations.id, invitationId))
      .limit(1)

    if (!rows[0]) return null
    return toInvitationDto(rows[0].invitation, rows[0].list.name)
  },
}
