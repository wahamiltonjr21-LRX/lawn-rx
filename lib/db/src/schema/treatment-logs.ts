import { pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";
import { diagnosesTable } from "./diagnoses";

export const treatmentLogsTable = pgTable("treatment_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  planId: uuid("plan_id").references(() => diagnosesTable.id, { onDelete: "set null" }),
  planTitle: text("plan_title").notNull(),
  stepTitle: text("step_title").notNull(),
  treatmentType: text("treatment_type").notNull(),
  scheduledDate: timestamp("scheduled_date", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
  notes: text("notes"),
  productUsed: text("product_used"),
});

export type TreatmentLog = typeof treatmentLogsTable.$inferSelect;
export type InsertTreatmentLog = typeof treatmentLogsTable.$inferInsert;
