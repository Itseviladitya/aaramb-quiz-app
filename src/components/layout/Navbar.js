"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  FiHome,
  FiLogIn,
  FiLogOut,
  FiSettings,
  FiUser,
  FiAward,
  FiMenu,
  FiX,
  FiEdit3,
  FiUserPlus,
} from "react-icons/fi";

export default function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: FiHome },
    { href: "/profile", label: "Profile", icon: FiUser },
    { href: "/leaderboard", label: "Leaderboard", icon: FiAward },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-900/80 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-2.5 text-lg font-bold text-white transition-opacity hover:opacity-80"
        >
          <FiEdit3 className="h-5 w-5 text-cyan-400" />
          <span>Aarambh Quiz App</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          {session ? (
            <>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              ))}
              {["admin", "manager"].includes(session.user.role) && (
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-amber-400 transition-colors hover:bg-amber-500/10 hover:text-amber-300"
                >
                  <FiSettings className="h-4 w-4" />
                  Admin
                </Link>
              )}
              <div className="ml-2 h-5 w-px bg-white/10" />
              <button
                type="button"
                onClick={() => signOut()}
                className="ml-2 inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-sm font-medium text-slate-300 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
              >
                <FiLogOut className="h-4 w-4" />
                Sign Out
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => router.push(`/login?callbackUrl=${encodeURIComponent("/dashboard")}`)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition-all hover:bg-white/10 hover:text-white"
              >
                <FiUserPlus className="h-4 w-4" />
                Sign up
              </button>
              <button
                type="button"
                onClick={() => router.push(`/login?callbackUrl=${encodeURIComponent("/dashboard")}`)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all hover:shadow-cyan-500/30"
              >
                <FiLogIn className="h-4 w-4" />
                Login
              </button>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="inline-flex items-center justify-center rounded-lg p-2 text-slate-300 transition hover:bg-white/10 hover:text-white md:hidden"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <FiX className="h-5 w-5" /> : <FiMenu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-white/10 bg-slate-900/95 backdrop-blur-xl md:hidden">
          <div className="space-y-1 px-4 py-3">
            {session ? (
              <>
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                ))}
                {["admin", "manager"].includes(session.user.role) && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-amber-400 transition-colors hover:bg-amber-500/10"
                  >
                    <FiSettings className="h-4 w-4" />
                    Admin
                  </Link>
                )}
                <div className="my-2 h-px bg-white/10" />
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    signOut();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <FiLogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    router.push(`/login?callbackUrl=${encodeURIComponent("/dashboard")}`);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3 py-2.5 text-sm font-semibold text-slate-200"
                >
                  <FiUserPlus className="h-4 w-4" />
                  Sign up
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    router.push(`/login?callbackUrl=${encodeURIComponent("/dashboard")}`);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 px-3 py-2.5 text-sm font-semibold text-white"
                >
                  <FiLogIn className="h-4 w-4" />
                  Login
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}