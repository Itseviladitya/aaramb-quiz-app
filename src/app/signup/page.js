import { redirect } from "next/navigation";

export default function SignUpPage() {
  redirect(`/login?callbackUrl=${encodeURIComponent("/dashboard")}`);
}
