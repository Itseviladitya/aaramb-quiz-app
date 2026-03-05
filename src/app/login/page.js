import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import LoginCard from "@/components/auth/LoginCard";

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
    // fall through to default
  }

  return "/dashboard";
}

export default async function LoginPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const callbackUrl = normalizeCallbackUrl(resolvedSearchParams?.callbackUrl);
  const session = await getServerSession(authOptions);
  if (session) {
    redirect(callbackUrl);
  }

  return <LoginCard callbackUrl={callbackUrl} />;
}
