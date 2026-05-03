import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type StoredTransaction = {
  id: string;
  userId: string;
  amount: number;
  category: string;
  date: string;
  notes?: string | null;
};

export type StoredUser = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
};

export type StoredSession = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  createdAt: string;
};

type Store = {
  users: StoredUser[];
  sessions: StoredSession[];
  transactions: StoredTransaction[];
  dailyPlans: Record<string, Record<string, number>>;
};

const storePath = path.join(process.cwd(), ".data", "spendtracker.json");

function daysAgo(days: number, hour: number, minute: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

const defaultStore: Store = {
  users: [],
  sessions: [],
  transactions: [
    { id: "seed-1", userId: "demo", amount: 18.4, category: "food", date: daysAgo(0, 12, 35) },
    { id: "seed-2", userId: "demo", amount: 4.2, category: "coffee", date: daysAgo(0, 8, 10) },
    { id: "seed-3", userId: "demo", amount: 31.8, category: "travel", date: daysAgo(1, 18, 45) },
    { id: "seed-4", userId: "demo", amount: 12.9, category: "food", date: daysAgo(3, 13, 5) },
    { id: "seed-5", userId: "demo", amount: 54, category: "shopping", date: daysAgo(8, 16, 20) },
    { id: "seed-6", userId: "demo", amount: 22.5, category: "home", date: daysAgo(34, 11, 50) },
    { id: "seed-7", userId: "demo", amount: 9.99, category: "fitness", date: daysAgo(92, 7, 30) }
  ],
  dailyPlans: {}
};

function normalizeStore(store: Partial<Store>): Store {
  const dailyPlans = store.dailyPlans ?? {};
  const isFlatPlanMap = Object.values(dailyPlans).some((value) => typeof value === "number");

  return {
    users: store.users ?? [],
    sessions: store.sessions ?? [],
    transactions: (store.transactions ?? []).map((transaction) => ({
      ...transaction,
      userId: transaction.userId ?? "demo"
    })),
    dailyPlans: isFlatPlanMap
      ? { demo: dailyPlans as unknown as Record<string, number> }
      : dailyPlans
  };
}

async function ensureStore() {
  await mkdir(path.dirname(storePath), { recursive: true });
}

export async function readStore(): Promise<Store> {
  await ensureStore();

  try {
    const contents = await readFile(storePath, "utf8");
    return normalizeStore(JSON.parse(contents) as Partial<Store>);
  } catch {
    await writeStore(defaultStore);
    return defaultStore;
  }
}

export async function writeStore(store: Store) {
  await ensureStore();
  await writeFile(storePath, JSON.stringify(store, null, 2));
}
