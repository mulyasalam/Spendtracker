import { randomBytes, scryptSync, timingSafeEqual, createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { appSessions, appUsers } from "@/db/schema";
import { readStore, writeStore, StoredUser } from "@/lib/local-store";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
};

export const sessionCookieName = "spendtracker_session";
const sessionMaxAgeSeconds = 60 * 60 * 24 * 30;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [algorithm, salt, hash] = storedHash.split("$");
  if (algorithm !== "scrypt" || !salt || !hash) return false;

  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return expected.length === candidate.length && timingSafeEqual(expected, candidate);
}

function parseCookie(header: string | null, name: string) {
  return header
    ?.split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

function publicUser(user: StoredUser | typeof appUsers.$inferSelect): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name
  };
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + sessionMaxAgeSeconds * 1000);
  const db = getDb();

  if (db) {
    await db.insert(appSessions).values({ userId, tokenHash, expiresAt });
  } else {
    const store = await readStore();
    store.sessions.push({
      id: crypto.randomUUID(),
      userId,
      tokenHash,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString()
    });
    await writeStore(store);
  }

  return token;
}

function isSecureRequest(request: Request) {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  if (forwardedProto) {
    return forwardedProto.split(",")[0]?.trim() === "https";
  }

  return new URL(request.url).protocol === "https:";
}

export function setSessionCookie(response: NextResponse, token: string, request: Request) {
  response.cookies.set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecureRequest(request),
    path: "/",
    maxAge: sessionMaxAgeSeconds
  });
}

export function clearSessionCookie(response: NextResponse, request: Request) {
  response.cookies.set(sessionCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecureRequest(request),
    path: "/",
    maxAge: 0
  });
}

export async function getCurrentUser(request: Request): Promise<AuthUser | null> {
  const token = parseCookie(request.headers.get("cookie"), sessionCookieName);
  if (!token) return null;

  const tokenHash = hashToken(token);
  const db = getDb();
  const now = new Date();

  if (db) {
    const [session] = await db
      .select()
      .from(appSessions)
      .where(eq(appSessions.tokenHash, tokenHash));

    if (!session || session.expiresAt <= now) return null;

    const [user] = await db.select().from(appUsers).where(eq(appUsers.id, session.userId));
    return user ? publicUser(user) : null;
  }

  const store = await readStore();
  const session = store.sessions.find((item) => item.tokenHash === tokenHash);
  if (!session || new Date(session.expiresAt) <= now) return null;

  const user = store.users.find((item) => item.id === session.userId);
  return user ? publicUser(user) : null;
}

export async function deleteCurrentSession(request: Request) {
  const token = parseCookie(request.headers.get("cookie"), sessionCookieName);
  if (!token) return;

  const tokenHash = hashToken(token);
  const db = getDb();

  if (db) {
    await db.delete(appSessions).where(eq(appSessions.tokenHash, tokenHash));
    return;
  }

  const store = await readStore();
  store.sessions = store.sessions.filter((session) => session.tokenHash !== tokenHash);
  await writeStore(store);
}

export async function findUserByEmail(email: string) {
  const normalized = normalizeEmail(email);
  const db = getDb();

  if (db) {
    const [user] = await db.select().from(appUsers).where(eq(appUsers.email, normalized));
    return user ?? null;
  }

  const store = await readStore();
  return store.users.find((user) => user.email === normalized) ?? null;
}

export async function createUser(email: string, name: string, password: string) {
  const normalized = normalizeEmail(email);
  const passwordHash = hashPassword(password);
  const db = getDb();

  if (db) {
    const [user] = await db
      .insert(appUsers)
      .values({ email: normalized, name: name.trim(), passwordHash })
      .returning();
    return user;
  }

  const store = await readStore();
  const user = {
    id: crypto.randomUUID(),
    email: normalized,
    name: name.trim(),
    passwordHash,
    createdAt: new Date().toISOString()
  };
  store.users.push(user);
  await writeStore(store);
  return user;
}

export function unauthorized() {
  return NextResponse.json({ error: "Authentication required." }, { status: 401 });
}
