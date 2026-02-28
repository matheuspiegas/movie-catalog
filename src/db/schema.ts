import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

export const lists = pgTable("lists", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: false })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: false })
    .defaultNow()
    .notNull(),
  userId: text("user_id").notNull(),
})

export const listItems = pgTable("list_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  listId: uuid("list_id")
    .notNull()
    .references(() => lists.id, { onDelete: "cascade" }),
  movieId: integer("movie_id").notNull(),
  movieTitle: text("movie_title").notNull(),
  moviePosterPath: text("movie_poster_path"),
  movieReleaseDate: text("movie_release_date"),
  movieVoteAverage: text("movie_vote_average"),
  mediaType: text("media_type").notNull(),
  addedAt: timestamp("added_at", { withTimezone: false })
    .defaultNow()
    .notNull(),
})
