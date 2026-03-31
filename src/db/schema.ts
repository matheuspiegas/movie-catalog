import { integer, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core"

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
  addedBy: text("added_by").notNull().default("unknown"),
})

export const invitations = pgTable(
  "invitations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    listId: uuid("list_id")
      .notNull()
      .references(() => lists.id, { onDelete: "cascade" }),
    inviterUserId: text("inviter_user_id").notNull(),
    inviteeEmail: text("invitee_email").notNull(),
    status: text("status").notNull(), // 'pending' | 'accepted' | 'rejected'
    createdAt: timestamp("created_at", { withTimezone: false })
      .defaultNow()
      .notNull(),
    respondedAt: timestamp("responded_at", { withTimezone: false }),
  },
  (table) => [unique().on(table.listId, table.inviteeEmail)],
)

export const listMembers = pgTable(
  "list_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    listId: uuid("list_id")
      .notNull()
      .references(() => lists.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    userName: text("user_name").notNull(),
    role: text("role").notNull(), // 'owner' | 'member'
    joinedAt: timestamp("joined_at", { withTimezone: false })
      .defaultNow()
      .notNull(),
  },
  (table) => [unique().on(table.listId, table.userId)],
)
