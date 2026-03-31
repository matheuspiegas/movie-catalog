import "server-only"
import type { InferSelectModel } from "drizzle-orm"
import { and, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { listMembers, lists } from "@/db/schema"
import { ForbiddenError, NotFoundError } from "@/lib/errors"
import { getUserSnapshotNames } from "@/lib/clerk-users"

export type ListMemberDto = {
  id: string
  listId: string
  userId: string
  userName: string
  role: "owner" | "member"
  joinedAt: string
}

type ListMemberRow = InferSelectModel<typeof listMembers>

const toListMemberDto = (row: ListMemberRow): ListMemberDto => ({
  id: row.id,
  listId: row.listId,
  userId: row.userId,
  userName: row.userName || row.userId,
  role: row.role as "owner" | "member",
  joinedAt: row.joinedAt.toISOString(),
})

const getListById = async (listId: string) => {
  const rows = await db.select().from(lists).where(eq(lists.id, listId)).limit(1)
  return rows[0] ?? null
}

const hydrateMemberNames = async (rows: ListMemberRow[]) => {
  const rowsWithoutSnapshot = rows.filter(
    (row) => !row.userName?.trim() || row.userName === row.userId,
  )

  if (rowsWithoutSnapshot.length === 0) {
    return rows
  }

  const namesByUserId = await getUserSnapshotNames(
    rowsWithoutSnapshot.map((row) => row.userId),
  )

  await Promise.all(
    rowsWithoutSnapshot.map((row) => {
      const userName = namesByUserId.get(row.userId) ?? row.userId
      return db
        .update(listMembers)
        .set({ userName })
        .where(
          and(
            eq(listMembers.listId, row.listId),
            eq(listMembers.userId, row.userId),
          ),
        )
    }),
  )

  return rows.map((row) => ({
    ...row,
    userName: namesByUserId.get(row.userId) ?? row.userName,
  }))
}

export const listMembersService = {
  async getByListId(listId: string, requestingUserId: string): Promise<ListMemberDto[]> {
    const list = await getListById(listId)
    if (!list) {
      throw new NotFoundError("Lista nao encontrada")
    }

    const permission = await listMembersService.checkPermission(
      listId,
      requestingUserId,
    )
    if (!permission.isMember) {
      throw new ForbiddenError("Voce nao tem acesso aos membros desta lista")
    }

    const rows = await db
      .select()
      .from(listMembers)
      .where(eq(listMembers.listId, listId))

    const hydratedRows = await hydrateMemberNames(rows)
    return hydratedRows.map(toListMemberDto)
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
    const list = await getListById(listId)
    if (!list) {
      throw new NotFoundError("Lista nao encontrada")
    }

    // 2. Verify requesting user is owner
    const requesterRows = await db
      .select()
      .from(listMembers)
      .where(and(eq(listMembers.listId, listId), eq(listMembers.userId, requestingUserId)))
      .limit(1)

    if (!requesterRows[0] || requesterRows[0].role !== "owner") {
      throw new ForbiddenError("Apenas o dono da lista pode remover membros")
    }

    // 3. Prevent removing the owner
    const memberRows = await db
      .select()
      .from(listMembers)
      .where(and(eq(listMembers.listId, listId), eq(listMembers.userId, memberUserId)))
      .limit(1)

    if (!memberRows[0]) {
      throw new NotFoundError("Membro nao encontrado")
    }

    if (memberRows[0].role === "owner") {
      throw new ForbiddenError("Nao e possivel remover o dono da lista")
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
