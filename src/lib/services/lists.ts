import "server-only"
import type { InferSelectModel } from "drizzle-orm"
import { eq, inArray } from "drizzle-orm"
import type { z } from "zod"
import { listMembers, lists } from "@/db/schema"
import { db } from "@/lib/db"
import { ForbiddenError, NotFoundError } from "@/lib/errors"
import type {
  createListSchema,
  updateListSchema,
} from "@/lib/schemas/lists.schema"
import { listMembersService } from "./list-members"

type CreateListInput = z.infer<typeof createListSchema> & { userName: string }
type UpdateListInput = z.infer<typeof updateListSchema>
type ListRow = InferSelectModel<typeof lists>

export type ListDto = {
  id: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
  userId: string
}

const toListDto = (list: ListRow): ListDto => ({
  id: list.id,
  name: list.name,
  description: list.description,
  createdAt: list.createdAt.toISOString(),
  updatedAt: list.updatedAt.toISOString(),
  userId: list.userId,
})

const getListById = async (listId: string) => {
  const rows = await db
    .select()
    .from(lists)
    .where(eq(lists.id, listId))
    .limit(1)
  return rows[0] ?? null
}

export const listsService = {
  async getAllByUser(userId: string): Promise<ListDto[]> {
    // Get all list IDs where user is a member
    const listIds = await listMembersService.getUserListIds(userId)

    if (listIds.length === 0) {
      return []
    }

    const rows = await db.select().from(lists).where(inArray(lists.id, listIds))
    return rows.map(toListDto)
  },

  async getList(listId: string, userId: string): Promise<ListDto> {
    const existing = await getListById(listId)

    if (!existing) {
      throw new NotFoundError("Lista nao encontrada")
    }

    const permission = await listMembersService.checkPermission(listId, userId)
    if (!permission.isMember) {
      throw new ForbiddenError("Voce nao tem acesso a esta lista")
    }

    return toListDto(existing)
  },

  async create(userId: string, data: CreateListInput): Promise<ListDto> {
    const rows = await db
      .insert(lists)
      .values({
        name: data.name,
        description: data.description ?? null,
        userId,
      })
      .returning()

    // Add creator as owner in list_members
    await db.insert(listMembers).values({
      listId: rows[0].id,
      userId,
      userName: data.userName,
      role: "owner",
    })

    return toListDto(rows[0])
  },

  async update(
    listId: string,
    userId: string,
    data: UpdateListInput,
  ): Promise<ListDto> {
    const existing = await getListById(listId)

    if (!existing) {
      throw new NotFoundError("Lista nao encontrada")
    }

    // Check if user has permission (owner or member)
    const permission = await listMembersService.checkPermission(listId, userId)
    if (!permission.isMember) {
      throw new ForbiddenError("Voce nao tem acesso a esta lista")
    }

    // Only owners can update list metadata
    if (!permission.isOwner) {
      throw new ForbiddenError("Apenas o dono da lista pode editar os detalhes")
    }

    const rows = await db
      .update(lists)
      .set({
        name: data.name ?? existing.name,
        description: data.description ?? existing.description,
        updatedAt: new Date(),
      })
      .where(eq(lists.id, listId))
      .returning()

    return toListDto(rows[0])
  },

  async delete(listId: string, userId: string): Promise<void> {
    const existing = await getListById(listId)

    if (!existing) {
      throw new NotFoundError("Lista nao encontrada")
    }

    // Check if user is owner
    const permission = await listMembersService.checkPermission(listId, userId)
    if (!permission.isOwner) {
      throw new ForbiddenError("Apenas o dono da lista pode excluir a lista")
    }

    await db.delete(lists).where(eq(lists.id, listId))
  },
}
