import { primaryKey, numeric, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export const appUsers = pgTable(
  "app_users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    emailIdx: uniqueIndex("app_users_email_idx").on(table.email)
  })
);

export const appSessions = pgTable("app_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => appUsers.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => appUsers.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  category: text("category").notNull().default("other"),
  date: timestamp("date", { withTimezone: true }).notNull().defaultNow(),
  notes: text("notes")
});

export const dailyPlans = pgTable(
  "daily_plans",
  {
    userId: uuid("user_id").notNull().references(() => appUsers.id, { onDelete: "cascade" }),
    dateKey: text("date_key").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull()
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.dateKey] })
  })
);
