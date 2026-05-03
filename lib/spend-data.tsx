"use client";

import {
  Coffee,
  Dumbbell,
  Home,
  MoreHorizontal,
  ShoppingBag,
  TrainFront,
  Utensils
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export type Category = {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
};

export type Transaction = {
  id: string;
  amount: number;
  category: string;
  date: string;
};

export type Period = "day" | "week" | "month" | "year";

const transactionStorageKey = "spendtracker.transactions.v1";
const planStorageKey = "spendtracker.dailyPlans.v1";
export const monthlyBudget = 1200;
export const defaultDailyPlan = 40;

export const categories: Category[] = [
  { id: "food", label: "Food", icon: Utensils },
  { id: "coffee", label: "Coffee", icon: Coffee },
  { id: "travel", label: "Travel", icon: TrainFront },
  { id: "shopping", label: "Shop", icon: ShoppingBag },
  { id: "home", label: "Home", icon: Home },
  { id: "fitness", label: "Fit", icon: Dumbbell },
  { id: "other", label: "Other", icon: MoreHorizontal }
];

export const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD"
});

function daysAgo(days: number, hour: number, minute: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

const initialTransactions: Transaction[] = [
  { id: "seed-1", amount: 18.4, category: "food", date: daysAgo(0, 12, 35) },
  { id: "seed-2", amount: 4.2, category: "coffee", date: daysAgo(0, 8, 10) },
  { id: "seed-3", amount: 31.8, category: "travel", date: daysAgo(1, 18, 45) },
  { id: "seed-4", amount: 12.9, category: "food", date: daysAgo(3, 13, 5) },
  { id: "seed-5", amount: 54.0, category: "shopping", date: daysAgo(8, 16, 20) },
  { id: "seed-6", amount: 22.5, category: "home", date: daysAgo(34, 11, 50) },
  { id: "seed-7", amount: 9.99, category: "fitness", date: daysAgo(92, 7, 30) }
];

export function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getCategory(id: string) {
  return categories.find((item) => item.id === id) ?? categories[categories.length - 1];
}

export function getDaysLeft(date: Date) {
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return Math.max(lastDay - date.getDate() + 1, 1);
}

export function getPeriodRange(period: Period, selectedDate: Date) {
  const start = new Date(selectedDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);

  if (period === "day") {
    end.setDate(start.getDate() + 1);
  }

  if (period === "week") {
    const mondayOffset = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - mondayOffset);
    end.setTime(start.getTime());
    end.setDate(start.getDate() + 7);
  }

  if (period === "month") {
    start.setDate(1);
    end.setFullYear(start.getFullYear(), start.getMonth() + 1, 1);
  }

  if (period === "year") {
    start.setMonth(0, 1);
    end.setFullYear(start.getFullYear() + 1, 0, 1);
  }

  return { start, end };
}

export function isInPeriod(transaction: Transaction, period: Period, selectedDate: Date) {
  const { start, end } = getPeriodRange(period, selectedDate);
  const date = new Date(transaction.date);
  return date >= start && date < end;
}

export function useSpendTracker() {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [dailyPlans, setDailyPlans] = useState<Record<string, number>>({});
  const [apiState, setApiState] = useState<"loading" | "online" | "offline" | "unauthorized">("loading");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      const storedTransactions = window.localStorage.getItem(transactionStorageKey);
      const storedPlans = window.localStorage.getItem(planStorageKey);

      if (storedTransactions) {
        setTransactions(JSON.parse(storedTransactions) as Transaction[]);
      }

      if (storedPlans) {
        setDailyPlans(JSON.parse(storedPlans) as Record<string, number>);
      }

      try {
        const [transactionsResponse, plansResponse] = await Promise.all([
          fetch("/api/transactions", { cache: "no-store", credentials: "include" }),
          fetch("/api/daily-plans", { cache: "no-store", credentials: "include" })
        ]);

        if (transactionsResponse.status === 401 || plansResponse.status === 401) {
          setTransactions([]);
          setDailyPlans({});
          setApiState("unauthorized");
          return;
        }

        if (!transactionsResponse.ok || !plansResponse.ok) {
          throw new Error("Backend unavailable");
        }

        const transactionsPayload = await transactionsResponse.json() as {
          transactions: Transaction[];
        };
        const plansPayload = await plansResponse.json() as {
          dailyPlans: Record<string, number>;
        };

        if (!isMounted) return;
        setTransactions(transactionsPayload.transactions);
        setDailyPlans(plansPayload.dailyPlans);
        setApiState("online");
      } catch {
        setApiState("offline");
        // Cached browser data keeps the PWA usable when the backend is unavailable.
      } finally {
        if (isMounted) {
          setIsReady(true);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isReady) return;
    window.localStorage.setItem(transactionStorageKey, JSON.stringify(transactions));
  }, [isReady, transactions]);

  useEffect(() => {
    if (!isReady) return;
    window.localStorage.setItem(planStorageKey, JSON.stringify(dailyPlans));
  }, [dailyPlans, isReady]);

  return useMemo(
    () => ({
      transactions,
      apiState,
      async addTransaction(amount: number, category: string) {
        const optimisticTransaction = {
          id: crypto.randomUUID(),
          amount,
          category,
          date: new Date().toISOString()
        };

        setTransactions((current) => [optimisticTransaction, ...current]);

        try {
          const response = await fetch("/api/transactions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ amount, category })
          });

          if (response.status === 401) {
            setApiState("unauthorized");
            throw new Error("Authentication required");
          }

          if (!response.ok) {
            throw new Error("Unable to create transaction");
          }

          const payload = await response.json() as { transaction: Transaction };
          setApiState("online");
          setTransactions((current) =>
            current.map((transaction) =>
              transaction.id === optimisticTransaction.id
                ? payload.transaction
                : transaction
            )
          );
        } catch {
          setTransactions((current) =>
            current.filter((transaction) => transaction.id !== optimisticTransaction.id)
          );
        }
      },
      async removeTransaction(id: string) {
        const previousTransactions = transactions;
        setTransactions((current) => current.filter((item) => item.id !== id));

        try {
          const response = await fetch(`/api/transactions/${id}`, {
            method: "DELETE",
            credentials: "include"
          });

          if (response.status === 401) {
            setApiState("unauthorized");
            throw new Error("Authentication required");
          }

          if (!response.ok) {
            throw new Error("Unable to delete transaction");
          }

          setApiState("online");
        } catch {
          setTransactions(previousTransactions);
        }
      },
      getDailyPlan(key: string) {
        return dailyPlans[key] ?? defaultDailyPlan;
      },
      async setDailyPlan(key: string, amount: number) {
        const previousPlans = dailyPlans;
        setDailyPlans((current) => ({ ...current, [key]: amount }));

        try {
          const response = await fetch("/api/daily-plans", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ dateKey: key, amount })
          });

          if (response.status === 401) {
            setApiState("unauthorized");
            throw new Error("Authentication required");
          }

          if (!response.ok) {
            throw new Error("Unable to save daily plan");
          }

          setApiState("online");
        } catch {
          setDailyPlans(previousPlans);
        }
      }
    }),
    [apiState, dailyPlans, transactions]
  );
}
