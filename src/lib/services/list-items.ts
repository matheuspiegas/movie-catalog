import "server-only"
import type { z } from "zod"
import { and, eq } from "drizzle-orm"
import type { InferSelectModel } from "drizzle-orm"
import { db } from "@/lib/db"
import { listItems, listMembers, lists } from "@/db/schema"
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "@/lib/errors"
import { createListItemSchema } from "@/lib/schemas/list-items.schema"
import { listMembersService } from "./list-members"

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
  addedBy: string
  addedByName: string
}

const toListItemDto = (item: ListItemRow, addedByName?: string): ListItemDto => ({
  id: item.id,
  listId: item.listId,
  movieId: item.movieId,
  movieTitle: item.movieTitle,
  moviePosterPath: item.moviePosterPath,
  movieReleaseDate: item.movieReleaseDate,
  movieVoteAverage: item.movieVoteAverage,
  mediaType: item.mediaType,
  addedAt: item.addedAt.toISOString(),
  addedBy: item.addedBy,
  addedByName: addedByName ?? item.addedBy,
})

const assertListAccess = async (listId: string, userId: string) => {
  const rows = await db.select().from(lists).where(eq(lists.id, listId)).limit(1)
  const list = rows[0]

  if (!list) {
    throw new NotFoundError("Lista nao encontrada")
  }

  // Check if user has access to this list
  const permission = await listMembersService.checkPermission(listId, userId)
  if (!permission.isMember) {
    throw new ForbiddenError("Voce nao tem acesso a esta lista")
  }

  return permission
}

export const listItemsService = {
  async getAllByList(listId: string, userId: string): Promise<ListItemDto[]> {
    await assertListAccess(listId, userId)
    const rows = await db
      .select({
        item: listItems,
        addedByName: listMembers.userName,
      })
      .from(listItems)
      .leftJoin(
        listMembers,
        and(
          eq(listMembers.listId, listItems.listId),
          eq(listMembers.userId, listItems.addedBy),
        ),
      )
      .where(eq(listItems.listId, listId))

    return rows.map((row) => toListItemDto(row.item, row.addedByName ?? undefined))
  },

  async create(
    listId: string,
    userId: string,
    data: CreateListItemInput
  ): Promise<ListItemDto> {
    // Members can add items
    await assertListAccess(listId, userId)

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
      throw new ConflictError("Este item ja esta na lista")
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
        addedBy: userId,
      })
      .returning()

    const memberRows = await db
      .select({ userName: listMembers.userName })
      .from(listMembers)
      .where(
        and(eq(listMembers.listId, listId), eq(listMembers.userId, userId)),
      )
      .limit(1)

    return toListItemDto(rows[0], memberRows[0]?.userName)
  },

  async delete(listId: string, itemId: string, userId: string): Promise<void> {
    const permission = await assertListAccess(listId, userId)

    const existingItem = await db
      .select()
      .from(listItems)
      .where(and(eq(listItems.listId, listId), eq(listItems.id, itemId)))
      .limit(1)

    if (existingItem.length === 0) {
      throw new NotFoundError("Item nao encontrado")
    }

    // Owners can delete any item, members can only delete their own
    if (!permission.isOwner && existingItem[0].addedBy !== userId) {
      throw new ForbiddenError("Voce so pode remover itens adicionados por voce")
    }

    await db.delete(listItems).where(eq(listItems.id, itemId))
  },
}
