"use client";

import { useEffect, useMemo, useState } from "react";
import { FiAlertTriangle, FiCheckCircle, FiClock, FiShield, FiTarget, FiLogOut, FiXCircle } from "react-icons/fi";
import { useProctoring } from "@/hooks/useProctoring";
import { useQuizSession } from "@/hooks/useQuizSession";
import { reportViolation } from "@/services/quizService";
import { apiRequest } from "@/services/apiClient";

export default function QuizSession({ attemptId }) {
  const [isFlashing, setIsFlashing] = useState(false);
  const [isLockedLocal, setIsLockedLocal] = useState(false);
  const {
    loading,
    submitting,
    done,
    question,
    progress,
    quizTimeLimitSec,
    timerMode,
    score,
    error,
    canAnswer,
    loadQuestion,
    answer,
    limitWarnings,
    isLockedServer,
  } = useQuizSession(attemptId);

  const [secondsLeft, setSecondsLeft] = useState(null);

  const { warnings } = useProctoring({
    onViolation: async (reason) => {
      // Haptic feedback & visual flash
      try {
        if ("vibrate" in navigator) navigator.vibrate([200, 100, 200]);
      } catch (e) {
        // ignore
      }
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 800);

      try {
        await reportViolation(attemptId, reason);
      } catch {
        // no-op
      }
    },
  });

  const handleExplicitExit = async () => {
    if (!window.confirm("Are you sure you want to stop? You will NOT be able to resume this quiz later unless an admin unlocks it. proceed with exit?")) return;
    try {
      await apiRequest(`/quizzes/attempts/${attemptId}/lock`, { method: "POST" });
      setIsLockedLocal(true);
    } catch {
      // No-op
    }
  };

  useEffect(() => {
    loadQuestion();
  }, [loadQuestion]);

  useEffect(() => {
    const limit = question?.timeLimitSec || (timerMode !== "question" ? quizTimeLimitSec : null);
    if (!limit) {
      queueMicrotask(() => setSecondsLeft(null));
      return;
    }
    queueMicrotask(() => setSecondsLeft(limit));
    const interval = setInterval(() => {
      setSecondsLeft((current) => {
        if (current === null) {
          return current;
        }
        return Math.max(current - 1, 0);
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [question?.id, question?.timeLimitSec, quizTimeLimitSec, timerMode]);

  const warningState = useMemo(() => {
    if (limitWarnings && warnings >= limitWarnings) {
      return "Disqualification threshold reached";
    }
    return `${warnings}/${limitWarnings || "?"} warnings`;
  }, [warnings, limitWarnings]);

  if (loading) {
    return <div className="rounded-xl border border-zinc-200 bg-white p-6 text-zinc-700">Loading session...</div>;
  }

  // Pre-emptively kick out if locked locally, returned locked from server, or limits exceeded
  if (isLockedLocal || isLockedServer || (limitWarnings && warnings >= limitWarnings)) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-900 shadow-sm">
        <FiXCircle className="mx-auto h-12 w-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Session Locked</h2>
        <p className="text-sm">
          Your quiz attempt has been locked due to proctoring violations or exiting early.
          Please contact your administrator if you believe this is an error.
        </p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-900">
        <div className="mb-2 flex items-center gap-2 text-lg font-semibold">
          <FiCheckCircle /> Quiz submitted
        </div>
        <p className="text-sm">Final score: {score}</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 rounded-2xl border transition-colors duration-300 p-6 shadow-sm ${isFlashing ? "bg-rose-100 border-rose-400" : "bg-white border-zinc-200"
      }`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-4">
        <div className="flex items-center flex-wrap gap-2 text-sm text-zinc-700">
          <button
            type="button"
            onClick={handleExplicitExit}
            className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-1 text-rose-600 hover:bg-rose-100 transition-colors"
          >
            <FiLogOut /> Exit
          </button>
          <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-1">
            <FiTarget /> {progress?.current || 0}/{progress?.total || 0}
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-1">
            <FiClock /> {secondsLeft ?? "--"}s
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-1">
            <FiShield /> {warningState}
          </span>
        </div>
        <div className="text-sm font-semibold text-zinc-800">Score: {score}</div>
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          <FiAlertTriangle /> {error}
        </div>
      ) : null}

      <h2 className="text-xl font-semibold text-zinc-900">{question?.text}</h2>

      <div className="grid gap-3">
        {question?.options?.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => answer(option.key)}
            disabled={!canAnswer}
            className="w-full rounded-lg border border-zinc-300 px-4 py-3 text-left text-zinc-800 transition hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="font-semibold">{option.key}.</span> {option.text}
          </button>
        ))}
      </div>

      {submitting ? <p className="text-sm text-zinc-600">Submitting answer...</p> : null}
    </div>
  );
}