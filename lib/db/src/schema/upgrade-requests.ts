import { sql } from "drizzle-orm";
import { pgEnum, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export const upgradeRequestStatusEnum = pgEnum("upgrade_request_status", [
  "pending",
  "fulfilled",
]);

export const upgradeRequestsTable = pgTable("upgrade_requests", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  message: varchar("message", { length: 1000 }).notNull().default(""),
  status: upgradeRequestStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type UpgradeRequest = typeof upgradeRequestsTable.$inferSelect;
export type InsertUpgradeRequest = typeof upgradeRequestsTable.$inferInsert;
