import { boolean, pgEnum, pgTable, real, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const professionalSubscriptionStatusEnum = pgEnum("professional_subscription_status", [
  "free",
  "starter",
  "professional",
  "premium",
]);

export const professionalsTable = pgTable("professionals", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessName: varchar("business_name", { length: 200 }).notNull(),
  ownerName: varchar("owner_name", { length: 200 }).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  phone: varchar("phone", { length: 30 }),
  approved: boolean("approved").notNull().default(false),
  subscriptionStatus: professionalSubscriptionStatusEnum("subscription_status").notNull().default("free"),
  serviceZipCodes: text("service_zip_codes").array().notNull().default([]),
  servicesOffered: text("services_offered").array().notNull().default([]),
  rating: real("rating"),
  stripeCustomerId: varchar("stripe_customer_id", { length: 200 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type Professional = typeof professionalsTable.$inferSelect;
export type InsertProfessional = typeof professionalsTable.$inferInsert;
