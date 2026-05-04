import { pgTable, text, timestamp, uuid, varchar, integer } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export const communityPostsTable = pgTable("community_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  userName: text("user_name").notNull(),
  userAvatar: text("user_avatar"),
  caption: text("caption").notNull(),
  photoDataUrl: text("photo_data_url"),
  likeCount: integer("like_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const communityCommentsTable = pgTable("community_comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id").notNull().references(() => communityPostsTable.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  userName: text("user_name").notNull(),
  userAvatar: text("user_avatar"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type CommunityPost = typeof communityPostsTable.$inferSelect;
export type InsertCommunityPost = typeof communityPostsTable.$inferInsert;
export type CommunityComment = typeof communityCommentsTable.$inferSelect;
export type InsertCommunityComment = typeof communityCommentsTable.$inferInsert;
