"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { FiGithub } from "react-icons/fi";

function normalizeCallbackUrl(value) {
  if (!value || typeof value !== "string") {
    return "/dashboard";
  }

  let candidate = value.trim();
  try {
    candidate = decodeURIComponent(candidate);
  } catch {
    // keep original candidate
  }

  if (candidate.startsWith("/")) {
    return candidate;
  }

  try {
    const callback = new URL(candidate);
    return `${callback.pathname}${callback.search}${callback.hash}`;
  } catch {
    // ignore parse errors and fallback
  }

  return "/dashboard";
}

export default function LoginCard({ callbackUrl = "/dashboard" }) {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get("error") || "";

  const resolvedCallbackUrl = useMemo(() => {
    const fromQuery = searchParams.get("callbackUrl");
    return normalizeCallbackUrl(fromQuery || callbackUrl);
  }, [searchParams, callbackUrl]);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(resolvedCallbackUrl);
    }
  }, [status, router, resolvedCallbackUrl]);

  return (
    <section className="mx-auto mt-10 max-w-md rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Sign in</h1>
      <p className="mt-2 text-sm text-zinc-600">Use GitHub login to access quizzes, leaderboard, and secure sessions.</p>
      {error ? (
        <p className="mt-3 rounded-md border border-rose-300 bg-rose-50 p-2 text-xs text-rose-700">
          Sign-in error: {error}. Try again once.
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => signIn("github", { callbackUrl: resolvedCallbackUrl })}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-zinc-900 px-4 py-3 font-medium text-white transition hover:bg-zinc-800"
      >
        <FiGithub /> Continue with GitHub
      </button>
    </section>
  );
}
