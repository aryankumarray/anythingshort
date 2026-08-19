"use client";

import { signOut } from "next-auth/react";
import { LogOut, Zap } from "lucide-react";

interface HeaderProps {
  user: {
    name: string;
    email: string;
    image: string | null;
    plan: "FREE" | "PRO";
  };
}

export function DashboardHeader({ user }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-zinc-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500">
            <Zap className="h-4 w-4 text-white" fill="white" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-white">
            AnythingShort
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="text-xs font-medium text-emerald-400">Live</span>
          </div>

          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              user.plan === "PRO"
                ? "bg-violet-500/15 text-violet-300"
                : "bg-white/5 text-zinc-400"
            }`}
          >
            {user.plan}
          </span>

          <div className="flex items-center gap-2">
            {user.image ? (
              <img
                src={user.image}
                alt={user.name}
                className="h-8 w-8 rounded-full"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-xs font-medium text-zinc-300">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="rounded-lg p-2 text-zinc-500 transition hover:bg-white/5 hover:text-zinc-200"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}