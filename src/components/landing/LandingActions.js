"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useState } from "react";
import ProfileCompletionModal from "@/components/profile/ProfileCompletionModal";

export default function LandingActions({ sessionUser }) {
  const [showModal, setShowModal] = useState(false);

  function onSignUpClick() {
    if (!sessionUser) {
      signIn("github", { callbackUrl: "/dashboard" });
      return;
    }
    setShowModal(true);
  }

  function onLoginClick() {
    if (sessionUser) {
      return;
    }
    signIn("github", { callbackUrl: "/dashboard" });
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/dashboard" className="rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800">
          Start Quiz
        </Link>
        <button
          type="button"
          onClick={onLoginClick}
          className="rounded-md border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
        >
          Login with GitHub
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onSignUpClick}
          className="rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          Sign Up
        </button>
        <button
          type="button"
          onClick={onLoginClick}
          className="rounded-md border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
        >
          Login with GitHub
        </button>
      </div>

      {showModal ? (
        <ProfileCompletionModal
          profile={{
            fullName: sessionUser?.fullName || sessionUser?.name || "",
            email: sessionUser?.email || "",
            branch: sessionUser?.branch || "",
            yearOfStudy: sessionUser?.yearOfStudy || "",
            studentId: sessionUser?.studentId || "",
            phoneNumber: sessionUser?.phoneNumber || "",
          }}
          onCompleted={() => setShowModal(false)}
        />
      ) : null}
    </>
  );
}
