"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { FiGithub } from "react-icons/fi";

export default function LoginCard() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get("error") || "";

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

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
        onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-zinc-900 px-4 py-3 font-medium text-white transition hover:bg-zinc-800"
      >
        <FiGithub /> Continue with GitHub
      </button>
    </section>
  );
}
