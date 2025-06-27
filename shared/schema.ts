import { pgTable, text, serial, real, timestamp, varchar, jsonb, index, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const weeklyEarnings = pgTable("weekly_earnings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  weekStartDate: timestamp("week_start_date").notNull(),
  weekEndDate: timestamp("week_end_date").notNull(),
  boltTotalEarnings: real("bolt_total_earnings").notNull().default(0),
  uberTotalEarnings: real("uber_total_earnings").notNull().default(0),
  boltCashEarnings: real("bolt_cash_earnings").notNull().default(0),
  uberCashEarnings: real("uber_cash_earnings").notNull().default(0),
  totalEarnings: real("total_earnings").notNull().default(0),
  platformFee: real("platform_fee").notNull().default(0),
  fixedDeduction: real("fixed_deduction").notNull().default(0),
  totalCashEarnings: real("total_cash_earnings").notNull().default(0),
  netEarnings: real("net_earnings").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertWeeklyEarningsSchema = createInsertSchema(weeklyEarnings).omit({
  id: true,
  totalEarnings: true,
  platformFee: true,
  fixedDeduction: true,
  totalCashEarnings: true,
  netEarnings: true,
  createdAt: true,
});

export const updateWeeklyEarningsSchema = insertWeeklyEarningsSchema.partial().extend({
  boltTotalEarnings: z.number().min(0).optional(),
  uberTotalEarnings: z.number().min(0).optional(),
  boltCashEarnings: z.number().min(0).optional(),
  uberCashEarnings: z.number().min(0).optional(),
});

export type InsertWeeklyEarnings = z.infer<typeof insertWeeklyEarningsSchema>;
export type UpdateWeeklyEarnings = z.infer<typeof updateWeeklyEarningsSchema>;
export type WeeklyEarnings = typeof weeklyEarnings.$inferSelect;
