"use client";

import { useState } from "react";
import { FiShield } from "react-icons/fi";
import QuizCatalog from "@/components/quiz/QuizCatalog";
import ProfileCompletionModal from "@/components/profile/ProfileCompletionModal";

export default function DashboardHome({ sessionUser, hasRunningQuiz }) {
  const [profileComplete, setProfileComplete] = useState(Boolean(sessionUser.profileCompleted));

  return (
    <section className="space-y-6">
      {!profileComplete ? (
        <ProfileCompletionModal
          profile={{
            fullName: sessionUser.fullName,
            email: sessionUser.email,
            branch: sessionUser.branch,
            yearOfStudy: sessionUser.yearOfStudy,
            studentId: sessionUser.studentId,
            phoneNumber: sessionUser.phoneNumber,
          }}
          onCompleted={() => setProfileComplete(true)}
        />
      ) : null}

      <header className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-zinc-900">Quiz Lobby</h1>
        <p className="mt-2 text-sm text-zinc-600">Welcome to Aarambh Quiz Platform for Ramgarh Engineering College students.</p>
      </header>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 shadow-sm">
        <p className="flex items-center gap-2 font-semibold">
          <FiShield /> Proctoring & Security Rules
        </p>
        <ul className="mt-2 list-disc pl-5">
          <li>Tab switching and copy/paste are blocked and logged.</li>
          <li>Questions are served one-by-one from the backend.</li>
          <li>Server validates timing for each submission.</li>
        </ul>
      </div>

      {!hasRunningQuiz ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          No quizzes are currently running. Please check back later for upcoming quizzes and events.
        </p>
      ) : null}

      <QuizCatalog />
    </section>
  );
}