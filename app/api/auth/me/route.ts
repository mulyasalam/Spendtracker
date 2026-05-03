import { NextResponse } from "next/server";
import { getCurrentUser, unauthorized } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentUser(request);

  if (!user) {
    return unauthorized();
  }

  return NextResponse.json({ user });
}
