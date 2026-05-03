"use client";

import { clsx } from "clsx";
import { Banknote, CalendarDays, History, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { AuthGate, AuthUser, UserBar } from "@/components/auth-gate";
import {
  categories,
  currency,
  dateKey,
  getCategory,
  getDaysLeft,
  isInPeriod,
  monthlyBudget,
  useSpendTracker
} from "@/lib/spend-data";

function HomeContent({
  user,
  signOut
}: {
  user: AuthUser;
  signOut: () => Promise<void>;
}) {
  const [amount, setAmount] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("other");
  const inputRef = useRef<HTMLInputElement>(null);
  const todayKey = dateKey(new Date());
  const {
    transactions,
    addTransaction,
    removeTransaction,
    getDailyPlan,
    setDailyPlan,
    apiState
  } = useSpendTracker();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const spentThisMonth = useMemo(
    () => transactions.filter((item) => isInPeriod(item, "month", new Date()))
      .reduce((total, item) => total + item.amount, 0),
    [transactions]
  );
  const spentToday = useMemo(
    () => transactions.filter((item) => isInPeriod(item, "day", new Date()))
      .reduce((total, item) => total + item.amount, 0),
    [transactions]
  );
  const todayTransactions = useMemo(
    () => transactions.filter((item) => isInPeriod(item, "day", new Date())),
    [transactions]
  );
  const dailyPlan = getDailyPlan(todayKey);
  const daysLeft = getDaysLeft(new Date());
  const safeToSpend = Math.min(dailyPlan - spentToday, (monthlyBudget - spentThisMonth) / daysLeft);
  const dailyState =
    safeToSpend >= dailyPlan * 0.5 ? "good" : safeToSpend >= 0 ? "watch" : "tight";

  function appendDigit(value: string) {
    setAmount((current) => {
      if (value === "." && current.includes(".")) return current;
      if (current === "0" && value !== ".") return value;
      const next = `${current}${value}`;
      const [, decimals] = next.split(".");
      if (decimals?.length > 2) return current;
      return next;
    });
  }

  function backspace() {
    setAmount((current) => current.slice(0, -1));
  }

  function submitExpense(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const parsed = Number(amount);

    if (!Number.isFinite(parsed) || parsed <= 0) {
      inputRef.current?.focus();
      return;
    }

    addTransaction(parsed, selectedCategory);
    setAmount("");
    setSelectedCategory("other");
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-5 pt-[max(1rem,env(safe-area-inset-top))]">
      <section className="mb-4 grid grid-cols-[1fr_auto] items-start gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            SpendTracker
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-normal text-ink">
            Quick expense
          </h1>
        </div>
        <div
          className={clsx(
            "min-w-28 rounded-lg border px-3 py-2 text-right shadow-soft",
            dailyState === "good" && "border-emerald-200 bg-emerald-50 text-mint",
            dailyState === "watch" && "border-amber-200 bg-amber-50 text-amber",
            dailyState === "tight" && "border-red-200 bg-red-50 text-coral"
          )}
        >
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em]">
            Safe today
          </p>
          <p className="text-xl font-semibold tracking-normal">
            {currency.format(safeToSpend)}
          </p>
        </div>
      </section>

      <nav className="mb-3 grid grid-cols-2 gap-2">
        <Link
          href="/"
          className="flex h-11 items-center justify-center gap-2 rounded-lg bg-ink text-sm font-semibold text-white"
        >
          <Plus size={17} />
          Add
        </Link>
        <Link
          href="/history"
          className="flex h-11 items-center justify-center gap-2 rounded-lg border border-line bg-white text-sm font-semibold text-ink"
        >
          <History size={17} />
          History
        </Link>
      </nav>

      <UserBar user={user} signOut={signOut} apiState={apiState} />

      <section className="mb-3 rounded-lg border border-line bg-white px-4 py-3 shadow-soft">
        <label
          htmlFor="daily-plan"
          className="flex items-center gap-2 text-sm font-semibold text-ink"
        >
          <CalendarDays size={17} />
          Today&apos;s spend plan
        </label>
        <div className="mt-2 flex items-center gap-3">
          <input
            id="daily-plan"
            type="number"
            inputMode="decimal"
            min="0"
            step="1"
            value={dailyPlan}
            onChange={(event) => setDailyPlan(todayKey, Math.max(Number(event.target.value), 0))}
            className="h-11 min-w-0 flex-1 rounded-lg border border-line bg-paper px-3 text-lg font-semibold text-ink outline-none focus:border-ink"
          />
          <p className="w-28 text-right text-xs font-medium text-zinc-500">
            {currency.format(Math.max(dailyPlan - spentToday, 0))} left
          </p>
        </div>
      </section>

      <form onSubmit={submitExpense} className="flex flex-1 flex-col">
        <label className="sr-only" htmlFor="amount">
          Amount
        </label>
        <div className="rounded-lg border border-line bg-white px-4 py-5 shadow-soft">
          <div className="flex items-center gap-2">
            <Banknote aria-hidden="true" className="shrink-0 text-zinc-500" size={24} />
            <input
              ref={inputRef}
              id="amount"
              value={amount}
              inputMode="decimal"
              autoComplete="off"
              placeholder="0.00"
              onChange={(event) => {
                const next = event.target.value.replace(/[^\d.]/g, "");
                const [whole, decimal = ""] = next.split(".");
                setAmount(
                  next.includes(".")
                    ? `${whole}.${decimal.slice(0, 2)}`
                    : whole
                );
              }}
              className="min-w-0 flex-1 border-0 bg-transparent text-right text-5xl font-semibold tracking-normal text-ink outline-none placeholder:text-zinc-300"
            />
          </div>

          <div className="mt-5 grid grid-cols-4 gap-2">
            {categories.map((category) => {
              const Icon = category.icon;
              const isSelected = selectedCategory === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  title={category.label}
                  aria-label={category.label}
                  aria-pressed={isSelected}
                  onClick={() => setSelectedCategory(category.id)}
                  className={clsx(
                    "flex aspect-square flex-col items-center justify-center rounded-lg border text-xs font-medium transition",
                    isSelected
                      ? "border-ink bg-ink text-white"
                      : "border-line bg-paper text-zinc-700 active:bg-zinc-100"
                  )}
                >
                  <Icon size={21} strokeWidth={2.2} />
                  <span className="mt-1 leading-none">{category.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0"].map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => appendDigit(key)}
              className="flex h-16 items-center justify-center rounded-lg border border-line bg-white text-2xl font-semibold text-ink shadow-sm active:translate-y-px active:bg-zinc-50"
            >
              {key}
            </button>
          ))}
          <button
            type="button"
            onClick={backspace}
            className="flex h-16 items-center justify-center rounded-lg border border-line bg-white text-lg font-semibold text-ink shadow-sm active:translate-y-px active:bg-zinc-50"
          >
            Del
          </button>
        </div>

        <button
          type="submit"
          className="mt-3 flex h-14 items-center justify-center gap-2 rounded-lg bg-ink px-4 text-base font-semibold text-white shadow-soft active:translate-y-px"
        >
          <Plus size={20} />
          Add expense
        </button>
      </form>

      <section className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Today
          </h2>
          <p className="text-sm font-medium text-zinc-600">
            {currency.format(spentToday)} of {currency.format(dailyPlan)}
          </p>
        </div>

        <div className="space-y-2">
          {todayTransactions.slice(0, 5).map((transaction) => {
            const category = getCategory(transaction.category);
            const Icon = category.icon;

            return (
              <article
                key={transaction.id}
                className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 rounded-lg border border-line bg-white px-3 py-2"
              >
                <div className="flex aspect-square items-center justify-center rounded-lg bg-paper text-zinc-700">
                  <Icon size={19} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{category.label}</p>
                  <p className="text-xs text-zinc-500">
                    {new Date(transaction.date).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-ink">
                    {currency.format(transaction.amount)}
                  </p>
                  <button
                    type="button"
                    title="Delete transaction"
                    aria-label="Delete transaction"
                    onClick={() => removeTransaction(transaction.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 active:bg-zinc-100"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

export default function HomePage() {
  return (
    <AuthGate>
      {({ user, signOut }) => (
        <HomeContent key={user.id} user={user} signOut={signOut} />
      )}
    </AuthGate>
  );
}
