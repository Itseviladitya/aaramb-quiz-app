"use client";

import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import { FiAward, FiHome, FiLogIn, FiLogOut, FiSettings, FiUser } from "react-icons/fi";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-zinc-900">
          <FiHome /> Aarambh Quiz
        </Link>
        <div className="flex items-center gap-2 text-sm text-zinc-800">
          {session ? (
            <>
              <Link href="/dashboard" className="inline-flex items-center gap-1 rounded-md px-3 py-2 font-medium transition hover:bg-zinc-100">
                <FiHome /> Dashboard
              </Link>
              <Link href="/profile" className="inline-flex items-center gap-1 rounded-md px-3 py-2 font-medium transition hover:bg-zinc-100">
                <FiUser /> Profile
              </Link>
              <Link href="/leaderboard" className="inline-flex items-center gap-1 rounded-md px-3 py-2 font-medium transition hover:bg-zinc-100">
                <FiAward /> Leaderboard
              </Link>
              {session.user.role === "admin" ? (
                <Link href="/admin" className="inline-flex items-center gap-1 rounded-md px-3 py-2 font-medium transition hover:bg-zinc-100">
                  <FiSettings /> Admin
                </Link>
              ) : null}
              <button
                type="button"
                onClick={() => signOut()}
                className="inline-flex items-center gap-1 rounded-md border border-zinc-300 bg-white px-3 py-2 font-medium text-zinc-800 transition hover:bg-zinc-100"
              >
                <FiLogOut /> Sign Out
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => signIn("github")}
              className="inline-flex items-center gap-1 rounded-md border border-zinc-300 bg-white px-3 py-2 font-medium text-zinc-800 transition hover:bg-zinc-100"
            >
              <FiLogIn /> GitHub Login
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}