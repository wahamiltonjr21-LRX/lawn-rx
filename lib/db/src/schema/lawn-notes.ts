import { pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export const lawnNotesTable = pgTable("lawn_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  title: text("title").notNull(),
  body: text("body"),
  entryType: text("entry_type").notNull().default("note"),
  treatmentType: text("treatment_type"),
  productUsed: text("product_used"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type LawnNote = typeof lawnNotesTable.$inferSelect;
export type InsertLawnNote = typeof lawnNotesTable.$inferInsert;
