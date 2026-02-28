import "server-only"
import type { z } from "zod"
import { and, eq } from "drizzle-orm"
import type { InferSelectModel } from "drizzle-orm"
import { db } from "@/lib/db"
import { listItems, lists } from "@/db/schema"
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "@/lib/errors"
import { createListItemSchema } from "@/lib/schemas/list-items.schema"

type CreateListItemInput = z.infer<typeof createListItemSchema>
type ListItemRow = InferSelectModel<typeof listItems>

export type ListItemDto = {
  id: string
  listId: string
  movieId: number
  movieTitle: string
  moviePosterPath: string | null
  movieReleaseDate: string | null
  movieVoteAverage: string | null
  mediaType: string
  addedAt: string
}

const toListItemDto = (item: ListItemRow): ListItemDto => ({
  id: item.id,
  listId: item.listId,
  movieId: item.movieId,
  movieTitle: item.movieTitle,
  moviePosterPath: item.moviePosterPath,
  movieReleaseDate: item.movieReleaseDate,
  movieVoteAverage: item.movieVoteAverage,
  mediaType: item.mediaType,
  addedAt: item.addedAt.toISOString(),
})

const assertListOwnership = async (listId: string, userId: string) => {
  const rows = await db.select().from(lists).where(eq(lists.id, listId)).limit(1)
  const list = rows[0]

  if (!list) {
    throw new NotFoundError("List not found")
  }

  if (list.userId !== userId) {
    throw new ForbiddenError("List does not belong to user")
  }
}

export const listItemsService = {
  async getAllByList(listId: string, userId: string): Promise<ListItemDto[]> {
    await assertListOwnership(listId, userId)
    const rows = await db
      .select()
      .from(listItems)
      .where(eq(listItems.listId, listId))

    return rows.map(toListItemDto)
  },

  async create(
    listId: string,
    userId: string,
    data: CreateListItemInput
  ): Promise<ListItemDto> {
    await assertListOwnership(listId, userId)

    const existingItem = await db
      .select()
      .from(listItems)
      .where(
        and(
          eq(listItems.listId, listId),
          eq(listItems.movieId, data.movieId),
          eq(listItems.mediaType, data.mediaType)
        )
      )
      .limit(1)

    if (existingItem.length > 0) {
      throw new ConflictError("Item already in list")
    }

    const rows = await db
      .insert(listItems)
      .values({
        listId,
        movieId: data.movieId,
        movieTitle: data.movieTitle,
        moviePosterPath: data.moviePosterPath ?? null,
        movieReleaseDate: data.movieReleaseDate ?? null,
        movieVoteAverage: data.movieVoteAverage ?? null,
        mediaType: data.mediaType,
      })
      .returning()

    return toListItemDto(rows[0])
  },

  async delete(listId: string, itemId: string, userId: string): Promise<void> {
    await assertListOwnership(listId, userId)

    const existingItem = await db
      .select()
      .from(listItems)
      .where(and(eq(listItems.listId, listId), eq(listItems.id, itemId)))
      .limit(1)

    if (existingItem.length === 0) {
      throw new NotFoundError("Item not found")
    }

    await db.delete(listItems).where(eq(listItems.id, itemId))
  },
}
