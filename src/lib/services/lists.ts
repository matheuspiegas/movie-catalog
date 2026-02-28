import "server-only"
import type { z } from "zod"
import { eq } from "drizzle-orm"
import type { InferSelectModel } from "drizzle-orm"
import { db } from "@/lib/db"
import { lists } from "@/db/schema"
import { ForbiddenError, NotFoundError } from "@/lib/errors"
import {
  createListSchema,
  updateListSchema,
} from "@/lib/schemas/lists.schema"

type CreateListInput = z.infer<typeof createListSchema>
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
  const rows = await db.select().from(lists).where(eq(lists.id, listId)).limit(1)
  return rows[0] ?? null
}

export const listsService = {
  async getAllByUser(userId: string): Promise<ListDto[]> {
    const rows = await db.select().from(lists).where(eq(lists.userId, userId))
    return rows.map(toListDto)
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

    return toListDto(rows[0])
  },

  async update(
    listId: string,
    userId: string,
    data: UpdateListInput
  ): Promise<ListDto> {
    const existing = await getListById(listId)

    if (!existing) {
      throw new NotFoundError("List not found")
    }

    if (existing.userId !== userId) {
      throw new ForbiddenError("List does not belong to user")
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
      throw new NotFoundError("List not found")
    }

    if (existing.userId !== userId) {
      throw new ForbiddenError("List does not belong to user")
    }

    await db.delete(lists).where(eq(lists.id, listId))
  },
}
