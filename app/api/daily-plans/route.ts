import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { dailyPlans } from "@/db/schema";
import { upsertDailyPlanSchema } from "@/lib/api-validation";
import { readStore, writeStore } from "@/lib/local-store";
import { getCurrentUser, unauthorized } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toNumber(value: string | number) {
  return typeof value === "number" ? value : Number(value);
}

export async function GET(request: Request) {
  const user = await getCurrentUser(request);
  if (!user) return unauthorized();

  const db = getDb();

  if (db) {
    const rows = await db.select().from(dailyPlans).where(eq(dailyPlans.userId, user.id));
    return NextResponse.json({
      dailyPlans: Object.fromEntries(
        rows.map((row) => [row.dateKey, toNumber(row.amount)])
      )
    });
  }

  const store = await readStore();
  return NextResponse.json({ dailyPlans: store.dailyPlans[user.id] ?? {} });
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return unauthorized();

    const payload = upsertDailyPlanSchema.parse(await request.json());
    const db = getDb();

    if (db) {
      const [plan] = await db
        .insert(dailyPlans)
        .values({ userId: user.id, dateKey: payload.dateKey, amount: String(payload.amount) })
        .onConflictDoUpdate({
          target: [dailyPlans.userId, dailyPlans.dateKey],
          set: { amount: String(payload.amount) }
        })
        .returning();

      return NextResponse.json({
        dailyPlan: {
          dateKey: plan.dateKey,
          amount: toNumber(plan.amount)
        }
      });
    }

    const store = await readStore();
    store.dailyPlans[user.id] = {
      ...(store.dailyPlans[user.id] ?? {}),
      [payload.dateKey]: payload.amount
    };
    await writeStore(store);

    return NextResponse.json({
      dailyPlan: {
        dateKey: payload.dateKey,
        amount: payload.amount
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }

    return NextResponse.json({ error: "Unable to save daily plan." }, { status: 500 });
  }
}
