import { NextResponse } from "next/server";
import { clearSessionCookie, deleteCurrentSession } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  await deleteCurrentSession(request);
  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response, request);
  return response;
}
