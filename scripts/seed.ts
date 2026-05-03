import "dotenv/config";
import { scryptSync, randomBytes } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { dailyPlans, appUsers, transactions } from "../db/schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to seed the database.");
}

const sql = neon(databaseUrl);
const db = drizzle(sql);

const seedUser = {
  id: "11111111-1111-4111-8111-111111111111",
  email: process.env.SEED_USER_EMAIL ?? "demo@spendtracker.local",
  name: process.env.SEED_USER_NAME ?? "Demo User",
  password: process.env.SEED_USER_PASSWORD ?? "password123"
};

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

function daysAgo(days: number, hour: number, minute: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, minute, 0, 0);
  return date;
}

async function main() {
  await db
    .insert(appUsers)
    .values({
      id: seedUser.id,
      email: seedUser.email,
      name: seedUser.name,
      passwordHash: hashPassword(seedUser.password)
    })
    .onConflictDoUpdate({
      target: appUsers.email,
      set: {
        name: seedUser.name,
        passwordHash: hashPassword(seedUser.password)
      }
    });

  await db
    .insert(transactions)
    .values([
      {
        id: "22222222-2222-4222-8222-222222222221",
        userId: seedUser.id,
        amount: "18.40",
        category: "food",
        date: daysAgo(0, 12, 35)
      },
      {
        id: "22222222-2222-4222-8222-222222222222",
        userId: seedUser.id,
        amount: "4.20",
        category: "coffee",
        date: daysAgo(0, 8, 10)
      },
      {
        id: "22222222-2222-4222-8222-222222222223",
        userId: seedUser.id,
        amount: "31.80",
        category: "travel",
        date: daysAgo(1, 18, 45)
      },
      {
        id: "22222222-2222-4222-8222-222222222224",
        userId: seedUser.id,
        amount: "54.00",
        category: "shopping",
        date: daysAgo(8, 16, 20)
      }
    ])
    .onConflictDoNothing();

  const today = new Date();
  const todayKey = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0")
  ].join("-");

  await db
    .insert(dailyPlans)
    .values({ userId: seedUser.id, dateKey: todayKey, amount: "55.00" })
    .onConflictDoUpdate({
      target: [dailyPlans.userId, dailyPlans.dateKey],
      set: { amount: "55.00" }
    });

  console.log(`Seeded ${seedUser.email}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
