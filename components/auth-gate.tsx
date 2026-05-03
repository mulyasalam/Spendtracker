"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";
import { LogOut, ShieldCheck } from "lucide-react";
import { clsx } from "clsx";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
};

type AuthGateProps = {
  children: (props: {
    user: AuthUser;
    signOut: () => Promise<void>;
  }) => ReactNode;
};

type Mode = "signin" | "signup";

export function AuthGate({ children }: AuthGateProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadSession() {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include"
        });

        if (!response.ok) {
          setUser(null);
          return;
        }

        const payload = await response.json() as { user: AuthUser };
        setUser(payload.user);
      } finally {
        setIsLoading(false);
      }
    }

    loadSession();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/auth/${mode === "signin" ? "login" : "signup"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email, password })
      });

      const payload = await response.json() as { user?: AuthUser; error?: unknown };

      if (!response.ok || !payload.user) {
        setError(typeof payload.error === "string" ? payload.error : "Authentication failed.");
        return;
      }

      setUser(payload.user);
      setPassword("");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function signOut() {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include"
    });
    setUser(null);
  }

  if (isLoading) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center px-4">
        <div className="text-sm font-semibold text-zinc-500">Loading session...</div>
      </main>
    );
  }

  if (user) {
    return children({ user, signOut });
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-8">
      <section className="rounded-lg border border-line bg-white p-4 shadow-soft">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-ink text-white">
            <ShieldCheck size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              SpendTracker
            </p>
            <h1 className="text-xl font-semibold text-ink">
              {mode === "signin" ? "Sign in" : "Create account"}
            </h1>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-1 rounded-lg bg-paper p-1">
          {(["signin", "signup"] as Mode[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setMode(item);
                setError("");
              }}
              className={clsx(
                "h-10 rounded-md text-sm font-semibold",
                mode === item ? "bg-ink text-white" : "text-zinc-600"
              )}
            >
              {item === "signin" ? "Sign in" : "Sign up"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-4 space-y-3">
          {mode === "signup" ? (
            <label className="block">
              <span className="text-sm font-semibold text-ink">Name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                className="mt-1 h-11 w-full rounded-lg border border-line bg-paper px-3 text-base text-ink outline-none focus:border-ink"
                required
              />
            </label>
          ) : null}

          <label className="block">
            <span className="text-sm font-semibold text-ink">Email</span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              autoComplete="email"
              className="mt-1 h-11 w-full rounded-lg border border-line bg-paper px-3 text-base text-ink outline-none focus:border-ink"
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-ink">Password</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              minLength={mode === "signup" ? 8 : 1}
              className="mt-1 h-11 w-full rounded-lg border border-line bg-paper px-3 text-base text-ink outline-none focus:border-ink"
              required
            />
          </label>

          {error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-coral">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex h-12 w-full items-center justify-center rounded-lg bg-ink px-4 text-base font-semibold text-white disabled:opacity-60"
          >
            {isSubmitting ? "Working..." : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>
      </section>
    </main>
  );
}

export function UserBar({
  user,
  signOut,
  apiState
}: {
  user: AuthUser;
  signOut: () => Promise<void>;
  apiState: "loading" | "online" | "offline" | "unauthorized";
}) {
  return (
    <section className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-line bg-white px-3 py-2 shadow-sm">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
        <p className="truncate text-xs text-zinc-500">{user.email}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span
          className={clsx(
            "rounded-full px-2 py-1 text-[0.68rem] font-bold uppercase tracking-[0.12em]",
            apiState === "online" && "bg-emerald-50 text-mint",
            apiState === "loading" && "bg-zinc-100 text-zinc-500",
            apiState === "offline" && "bg-amber-50 text-amber",
            apiState === "unauthorized" && "bg-red-50 text-coral"
          )}
        >
          {apiState}
        </span>
        <button
          type="button"
          onClick={signOut}
          title="Sign out"
          aria-label="Sign out"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-paper text-ink"
        >
          <LogOut size={17} />
        </button>
      </div>
    </section>
  );
}
