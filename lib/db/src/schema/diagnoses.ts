import { pgTable, text, integer, timestamp, jsonb, uuid, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export const diagnosesTable = pgTable("diagnoses", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  severity: text("severity").notNull(),
  healthScore: integer("health_score").notNull(),
  confidence: integer("confidence").notNull(),
  summary: text("summary").notNull(),
  steps: jsonb("steps").notNull(),
  waterAdvice: text("water_advice").notNull(),
  lightAdvice: text("light_advice").notNull(),
  riskAdvice: text("risk_advice").notNull(),
  grassType: text("grass_type"),
  issueAppearance: text("issue_appearance"),
  description: text("description"),
  photoDataUrl: text("photo_data_url"),
  nickname: text("nickname"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type DiagnosisRow = typeof diagnosesTable.$inferSelect;
export type InsertDiagnosisRow = typeof diagnosesTable.$inferInsert;
