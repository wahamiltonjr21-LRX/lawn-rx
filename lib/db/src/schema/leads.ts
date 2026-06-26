import { integer, pgEnum, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";
import { diagnosesTable } from "./diagnoses";
import { professionalsTable } from "./professionals";

export const leadStatusEnum = pgEnum("lead_status", [
  "New",
  "Accepted",
  "Contacted",
  "Quoted",
  "Completed",
  "Closed",
]);

export const leadsTable = pgTable("leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  diagnosisId: uuid("diagnosis_id").references(() => diagnosesTable.id, { onDelete: "set null" }),
  professionalId: uuid("professional_id").references(() => professionalsTable.id, { onDelete: "set null" }),
  name: varchar("name", { length: 200 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 30 }),
  address: text("address"),
  zipCode: varchar("zip_code", { length: 10 }).notNull(),
  status: leadStatusEnum("status").notNull().default("New"),
  serviceType: varchar("service_type", { length: 100 }),
  leadScore: integer("lead_score").notNull().default(50),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const leadNotesTable = pgTable("lead_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  leadId: uuid("lead_id").notNull().references(() => leadsTable.id, { onDelete: "cascade" }),
  professionalId: uuid("professional_id").notNull().references(() => professionalsTable.id, { onDelete: "cascade" }),
  note: text("note").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Lead = typeof leadsTable.$inferSelect;
export type InsertLead = typeof leadsTable.$inferInsert;
export type LeadNote = typeof leadNotesTable.$inferSelect;
export type InsertLeadNote = typeof leadNotesTable.$inferInsert;
