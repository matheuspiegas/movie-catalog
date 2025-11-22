import { pgTable, text, timestamp, uuid, integer } from "drizzle-orm/pg-core"

export const listsTable = pgTable("lists", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  userId: text("user_id").notNull(), // Clerk user IDs são strings
})

export const listItemsTable = pgTable("list_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  listId: uuid("list_id")
    .notNull()
    .references(() => listsTable.id, { onDelete: "cascade" }),
  movieId: integer("movie_id").notNull(), // ID do TMDB
  movieTitle: text("movie_title").notNull(),
  moviePosterPath: text("movie_poster_path"),
  movieReleaseDate: text("movie_release_date"),
  movieVoteAverage: text("movie_vote_average"),
  mediaType: text("media_type").notNull(), // 'movie' ou 'tv'
  addedAt: timestamp("added_at").notNull().defaultNow(),
})
