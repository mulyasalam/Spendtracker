import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { transactions } from "@/db/schema";
import { createTransactionSchema } from "@/lib/api-validation";
import { readStore, writeStore } from "@/lib/local-store";
import { getCurrentUser, unauthorized } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toNumber(value: string | number) {
  return typeof value === "number" ? value : Number(value);
}

function stripUserId<T extends { userId: string }>(transaction: T) {
  const { userId: _userId, ...publicTransaction } = transaction;
  void _userId;
  return publicTransaction;
}

export async function GET(request: Request) {
  const user = await getCurrentUser(request);
  if (!user) return unauthorized();

  const db = getDb();

  if (db) {
    const rows = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, user.id))
      .orderBy(desc(transactions.date));
    return NextResponse.json({
      transactions: rows.map((row) => ({
        id: row.id,
        amount: toNumber(row.amount),
        category: row.category,
        date: row.date.toISOString(),
        notes: row.notes
      }))
    });
  }

  const store = await readStore();
  return NextResponse.json({
    transactions: store.transactions
      .filter((transaction) => transaction.userId === user.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map(stripUserId)
  });
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return unauthorized();

    const payload = createTransactionSchema.parse(await request.json());
    const db = getDb();

    if (db) {
      const [created] = await db
        .insert(transactions)
        .values({
          userId: user.id,
          amount: String(payload.amount),
          category: payload.category,
          notes: payload.notes
        })
        .returning();

      return NextResponse.json(
        {
          transaction: {
            id: created.id,
            amount: toNumber(created.amount),
            category: created.category,
            date: created.date.toISOString(),
            notes: created.notes
          }
        },
        { status: 201 }
      );
    }

    const store = await readStore();
    const transaction = {
      id: crypto.randomUUID(),
      userId: user.id,
      amount: payload.amount,
      category: payload.category,
      date: new Date().toISOString(),
      notes: payload.notes
    };

    store.transactions = [transaction, ...store.transactions];
    await writeStore(store);

    return NextResponse.json({ transaction: stripUserId(transaction) }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }

    return NextResponse.json({ error: "Unable to create transaction." }, { status: 500 });
  }
}
