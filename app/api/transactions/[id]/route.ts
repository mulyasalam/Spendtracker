import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { transactions } from "@/db/schema";
import { readStore, writeStore } from "@/lib/local-store";
import { getCurrentUser, unauthorized } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser(_request);
  if (!user) return unauthorized();

  const db = getDb();

  if (db) {
    await db.delete(transactions).where(
      and(eq(transactions.id, id), eq(transactions.userId, user.id))
    );
    return NextResponse.json({ ok: true });
  }

  const store = await readStore();
  store.transactions = store.transactions.filter(
    (transaction) => transaction.id !== id || transaction.userId !== user.id
  );
  await writeStore(store);

  return NextResponse.json({ ok: true });
}
