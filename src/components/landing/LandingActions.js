"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FiArrowRight } from "react-icons/fi";
import ProfileCompletionModal from "@/components/profile/ProfileCompletionModal";

export default function LandingActions({ sessionUser }) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  function onSignUpClick() {
    if (!sessionUser) {
      router.push(`/login?callbackUrl=${encodeURIComponent("/dashboard")}`);
      return;
    }
    setShowModal(true);
  }

  function onLoginClick() {
    if (sessionUser) {
      return;
    }
    router.push(`/login?callbackUrl=${encodeURIComponent("/dashboard")}`);
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-4">
        <Link
          href="/dashboard"
          className="landing-btn-primary inline-flex items-center gap-2 text-sm"
        >
          {sessionUser ? "Go to Dashboard" : "Start Quiz"}
          <FiArrowRight className="w-4 h-4" />
        </Link>
        {!sessionUser && (
          <>
            <button
              type="button"
              onClick={onLoginClick}
              className="landing-btn-secondary inline-flex items-center gap-2 text-sm"
            >
              Login
            </button>
            <button
              type="button"
              onClick={onSignUpClick}
              className="landing-btn-secondary inline-flex items-center gap-2 text-sm"
            >
              Sign Up
            </button>
          </>
        )}
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
