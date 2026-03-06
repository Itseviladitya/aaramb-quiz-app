"use client";

import { getProviders, signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FiGithub } from "react-icons/fi";
import { FaGoogle } from "react-icons/fa";

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
  const [providers, setProviders] = useState({});
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

  useEffect(() => {
    getProviders()
      .then((result) => setProviders(result || {}))
      .catch(() => setProviders({}));
  }, []);

  const providerList = useMemo(() => {
    return Object.values(providers || {}).filter((provider) => ["github", "google"].includes(provider.id));
  }, [providers]);

  return (
    <section className="mx-auto mt-10 max-w-md rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Login / Sign up</h1>
      <p className="mt-2 text-sm text-zinc-600">Use GitHub or Google to continue. If your account does not exist, it will be created automatically.</p>
      {error ? (
        <p className="mt-3 rounded-md border border-rose-300 bg-rose-50 p-2 text-xs text-rose-700">
          Sign-in error: {error}. Try again once.
        </p>
      ) : null}

      <div className="mt-6 space-y-3">
        {providerList.map((provider) => (
          <button
            key={provider.id}
            type="button"
            onClick={() => signIn(provider.id, { callbackUrl: resolvedCallbackUrl })}
            className={`inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-3 font-medium transition ${provider.id === "google"
                ? "border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50"
                : "bg-zinc-900 text-white hover:bg-zinc-800"
              }`}
          >
            {provider.id === "google" ? <FaGoogle /> : <FiGithub />}
            Continue with {provider.name}
          </button>
        ))}

        {!providerList.length ? (
          <p className="rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-800">
            No login provider is configured. Please check OAuth environment variables.
          </p>
        ) : null}
      </div>

      <div className="mt-5 border-t border-zinc-200 pt-4 text-center text-xs text-zinc-500">
        Both <span className="font-medium text-zinc-700">Login</span> and <span className="font-medium text-zinc-700">Sign up</span> use the same page.
      </div>
    </section>
  );
}
