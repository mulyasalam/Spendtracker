"use client";

import { clsx } from "clsx";
import { ArrowLeft, CalendarDays, Check, Plus, SlidersHorizontal, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AuthGate, AuthUser, UserBar } from "@/components/auth-gate";
import {
  currency,
  dateKey,
  getCategory,
  getPeriodRange,
  isInPeriod,
  Period,
  useSpendTracker
} from "@/lib/spend-data";

const periods: { id: Period; label: string }[] = [
  { id: "day", label: "Day" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "year", label: "Year" }
];

function formatRange(period: Period, selectedDate: Date) {
  const { start, end } = getPeriodRange(period, selectedDate);
  const inclusiveEnd = new Date(end);
  inclusiveEnd.setDate(inclusiveEnd.getDate() - 1);

  if (period === "day") {
    return start.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
  }

  if (period === "year") {
    return String(start.getFullYear());
  }

  return `${start.toLocaleDateString([], { month: "short", day: "numeric" })} - ${inclusiveEnd.toLocaleDateString([], { month: "short", day: "numeric" })}`;
}

function HistoryContent({
  user,
  signOut
}: {
  user: AuthUser;
  signOut: () => Promise<void>;
}) {
  const [period, setPeriod] = useState<Period>("day");
  const [selectedDateValue, setSelectedDateValue] = useState(dateKey(new Date()));
  const selectedDate = useMemo(
    () => new Date(`${selectedDateValue}T12:00:00`),
    [selectedDateValue]
  );
  const selectedKey = dateKey(selectedDate);
  const {
    transactions,
    removeTransaction,
    getDailyPlan,
    setDailyPlan,
    apiState
  } = useSpendTracker();

  const filteredTransactions = useMemo(
    () => transactions.filter((item) => isInPeriod(item, period, selectedDate)),
    [period, selectedDate, transactions]
  );
  const total = filteredTransactions.reduce((sum, item) => sum + item.amount, 0);
  const dailyPlan = getDailyPlan(selectedKey);
  const remainingForDay = dailyPlan - total;
  const { start, end } = getPeriodRange(period, selectedDate);
  const dayCount = Math.max(Math.round((end.getTime() - start.getTime()) / 86400000), 1);
  const averagePerDay = total / dayCount;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-5 pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            SpendTracker
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-normal text-ink">
            History
          </h1>
        </div>
        <Link
          href="/"
          aria-label="Back to quick entry"
          title="Back to quick entry"
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-line bg-white text-ink shadow-sm"
        >
          <ArrowLeft size={20} />
        </Link>
      </header>

      <nav className="mb-3 grid grid-cols-2 gap-2">
        <Link
          href="/"
          className="flex h-11 items-center justify-center gap-2 rounded-lg border border-line bg-white text-sm font-semibold text-ink"
        >
          <Plus size={17} />
          Add
        </Link>
        <Link
          href="/history"
          className="flex h-11 items-center justify-center gap-2 rounded-lg bg-ink text-sm font-semibold text-white"
        >
          <SlidersHorizontal size={17} />
          History
        </Link>
      </nav>

      <UserBar user={user} signOut={signOut} apiState={apiState} />

      <section className="rounded-lg border border-line bg-white p-3 shadow-soft">
        <div className="grid grid-cols-4 gap-1 rounded-lg bg-paper p-1">
          {periods.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPeriod(item.id)}
              className={clsx(
                "h-9 rounded-md text-sm font-semibold",
                period === item.id
                  ? "bg-ink text-white"
                  : "text-zinc-600 active:bg-white"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <label
          htmlFor="history-date"
          className="mt-3 flex items-center gap-2 text-sm font-semibold text-ink"
        >
          <CalendarDays size={17} />
          Date
        </label>
        <input
          id="history-date"
          type="date"
          value={selectedDateValue}
          onChange={(event) => setSelectedDateValue(event.target.value)}
          className="mt-2 h-11 w-full rounded-lg border border-line bg-paper px-3 text-base font-semibold text-ink outline-none focus:border-ink"
        />
      </section>

      <section className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-line bg-white p-3 shadow-soft">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">
            {formatRange(period, selectedDate)}
          </p>
          <p className="mt-2 text-2xl font-semibold text-ink">{currency.format(total)}</p>
          <p className="mt-1 text-xs font-medium text-zinc-500">
            {filteredTransactions.length} expenses
          </p>
        </div>
        <div className="rounded-lg border border-line bg-white p-3 shadow-soft">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">
            Avg / day
          </p>
          <p className="mt-2 text-2xl font-semibold text-ink">
            {currency.format(averagePerDay)}
          </p>
          <p className="mt-1 text-xs font-medium text-zinc-500">
            {dayCount} day window
          </p>
        </div>
      </section>

      <section className="mt-3 rounded-lg border border-line bg-white px-4 py-3 shadow-soft">
        <label htmlFor="daily-plan" className="text-sm font-semibold text-ink">
          Spending plan for {selectedDate.toLocaleDateString([], { month: "short", day: "numeric" })}
        </label>
        <div className="mt-2 flex items-center gap-3">
          <input
            id="daily-plan"
            type="number"
            inputMode="decimal"
            min="0"
            step="1"
            value={dailyPlan}
            onChange={(event) => setDailyPlan(selectedKey, Math.max(Number(event.target.value), 0))}
            className="h-11 min-w-0 flex-1 rounded-lg border border-line bg-paper px-3 text-lg font-semibold text-ink outline-none focus:border-ink"
          />
          <div
            className={clsx(
              "flex h-11 min-w-28 items-center justify-end gap-2 rounded-lg px-3 text-sm font-semibold",
              remainingForDay >= 0
                ? "bg-emerald-50 text-mint"
                : "bg-red-50 text-coral"
            )}
          >
            <Check size={16} />
            {currency.format(remainingForDay)}
          </div>
        </div>
      </section>

      <section className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Expenses
          </h2>
          <p className="text-sm font-medium text-zinc-600">
            {currency.format(total)}
          </p>
        </div>

        <div className="space-y-2">
          {filteredTransactions.length === 0 ? (
            <div className="rounded-lg border border-dashed border-line bg-white px-4 py-8 text-center text-sm font-medium text-zinc-500">
              No expenses in this period.
            </div>
          ) : (
            filteredTransactions.map((transaction) => {
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
                      {new Date(transaction.date).toLocaleString([], {
                        month: "short",
                        day: "numeric",
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
            })
          )}
        </div>
      </section>
    </main>
  );
}

export default function HistoryPage() {
  return (
    <AuthGate>
      {({ user, signOut }) => (
        <HistoryContent key={user.id} user={user} signOut={signOut} />
      )}
    </AuthGate>
  );
}
