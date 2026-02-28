import { z } from "zod"

export const listIdParamsSchema = z.object({
  listId: z.uuid(),
})

export const listItemParamsSchema = z.object({
  listId: z.uuid(),
  itemId: z.uuid(),
})

export const createListItemSchema = z.object({
  movieId: z.number().int().positive(),
  movieTitle: z.string().min(1).max(500),
  moviePosterPath: z.string().max(500).optional().nullable(),
  movieReleaseDate: z.string().max(50).optional().nullable(),
  movieVoteAverage: z.string().max(10).optional().nullable(),
  mediaType: z.string().min(1).max(50),
})
