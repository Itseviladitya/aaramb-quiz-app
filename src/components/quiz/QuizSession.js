"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FiAlertTriangle, FiCheckCircle, FiClock, FiShield, FiTarget, FiLogOut, FiXCircle } from "react-icons/fi";
import { useProctoring } from "@/hooks/useProctoring";
import { useQuizSession } from "@/hooks/useQuizSession";
import { reportViolation, requestResubmit } from "@/services/quizService";
import { apiRequest } from "@/services/apiClient";

export default function QuizSession({ attemptId }) {
  const [isFlashing, setIsFlashing] = useState(false);
  const [isLockedLocal, setIsLockedLocal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [lastWarningReason, setLastWarningReason] = useState("");
  const [requestState, setRequestState] = useState({ loading: false, message: "", error: "" });
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

      setLastWarningReason(reason);
      setShowWarningModal(true);

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

  const handleTimeUp = useCallback(() => {
    // If we haven't answered yet and the timer hits 0, auto-submit empty.
    if (canAnswer && !submitting) {
      answer("TIMEOUT");
    }
  }, [canAnswer, submitting, answer]);

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
        const next = Math.max(current - 1, 0);
        if (next === 0 && current > 0) {
          handleTimeUp();
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [question?.id, question?.timeLimitSec, quizTimeLimitSec, timerMode, handleTimeUp]);

  const warningState = useMemo(() => {
    if (limitWarnings && warnings >= limitWarnings) {
      return "Disqualification threshold reached";
    }
    return `${warnings}/${limitWarnings || "?"} warnings`;
  }, [warnings, limitWarnings]);

  const handleRequestResubmit = useCallback(async () => {
    const reason = window.prompt("Explain your issue (technical glitch/disqualification concern):");
    if (!reason || reason.trim().length < 5) {
      setRequestState({ loading: false, message: "", error: "Please provide a clear reason (min 5 chars)." });
      return;
    }

    setRequestState({ loading: true, message: "", error: "" });
    try {
      await requestResubmit(attemptId, reason.trim());
      setRequestState({
        loading: false,
        message: "Request submitted successfully. Admin/Manager will review it soon.",
        error: "",
      });
    } catch (reqError) {
      setRequestState({
        loading: false,
        message: "",
        error: reqError.message || "Unable to submit request",
      });
    }
  }, [attemptId]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-500"></div>
          <p className="text-sm font-medium text-slate-400">Loading your quiz session...</p>
        </div>
      </div>
    );
  }

  // Pre-emptively kick out if locked locally, returned locked from server, or limits exceeded
  if (isLockedLocal || isLockedServer || (limitWarnings && warnings >= limitWarnings)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-3xl border border-rose-500/30 bg-slate-900/60 p-10 text-center shadow-2xl backdrop-blur-xl">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-rose-500/10">
            <FiXCircle className="h-10 w-10 text-rose-500" />
          </div>
          <h2 className="mb-3 text-3xl font-bold text-white tracking-tight">Session Locked</h2>
          <p className="mb-8 text-slate-400 leading-relaxed">
            Your quiz attempt has been locked due to proctoring violations or exiting early.
            Please contact your administrator if you believe this is an error.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleRequestResubmit}
              disabled={requestState.loading}
              className="rounded-xl bg-amber-500/20 px-6 py-3 font-semibold text-amber-300 shadow-lg transition-all hover:bg-amber-500/30 disabled:opacity-50"
            >
              {requestState.loading ? "Submitting..." : "Request Re-submit"}
            </button>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="rounded-xl bg-slate-800 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:bg-slate-700"
            >
              Return to Dashboard
            </button>
          </div>
          {requestState.message ? (
            <p className="mt-4 text-sm text-emerald-300">{requestState.message}</p>
          ) : null}
          {requestState.error ? (
            <p className="mt-4 text-sm text-rose-300">{requestState.error}</p>
          ) : null}
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-3xl border border-emerald-500/30 bg-slate-900/60 p-10 text-center shadow-2xl backdrop-blur-xl">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
            <FiCheckCircle className="h-10 w-10 text-emerald-500" />
          </div>
          <h2 className="mb-3 text-3xl font-bold text-white tracking-tight">Quiz Submitted</h2>
          <p className="mb-6 text-slate-400">Excellent work! Your answers have been safely recorded.</p>
          <div className="mx-auto mb-8 inline-block rounded-2xl bg-emerald-500/10 px-8 py-4">
            <p className="text-sm font-medium text-emerald-400/80 uppercase tracking-widest mb-1">Final Score</p>
            <p className="text-5xl font-black text-emerald-400">{score}</p>
          </div>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 px-8 py-3 font-semibold shadow-lg transition-all"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const isFinalQuestion = progress?.current === progress?.total;
  const progressPercent = progress ? (progress.current / progress.total) * 100 : 0;

  return (
    <div className={`mx-auto w-full max-w-4xl space-y-6 transition-colors duration-500 ${isFlashing ? "bg-rose-500/5" : ""
      }`}>

      {/* Top HUD */}
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-700/50 bg-slate-900/60 p-6 shadow-xl backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3 text-sm font-medium">
          <button
            type="button"
            onClick={handleExplicitExit}
            className="inline-flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-rose-400 transition-all hover:bg-rose-500/20"
          >
            <FiLogOut /> Exit Setup
          </button>

          <div className="inline-flex items-center gap-2 rounded-xl bg-slate-800/80 px-4 py-2 text-slate-300">
            <FiShield className={warnings > 0 ? "text-amber-500" : "text-emerald-500"} />
            <span className={warnings > 0 ? "text-amber-100" : ""}>{warningState}</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-6 sm:justify-end">
          <div className="text-right">
            <p className="text-xs tracking-wider text-slate-500 uppercase">Current Score</p>
            <p className="text-2xl font-bold text-white">{score}</p>
          </div>

          <div className="flex min-w-[120px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-600/20 px-4 py-3 border border-cyan-500/30">
            <FiClock className="h-5 w-5 text-cyan-400 animate-pulse" />
            <span className="text-xl font-mono font-bold text-white tracking-widest">
              {secondsLeft === null ? "∞" : secondsLeft < 10 ? `0${secondsLeft}` : secondsLeft}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-2">
        <div className="mb-2 flex justify-between text-xs font-bold uppercase tracking-widest text-slate-400">
          <span>Question {progress?.current || 0}</span>
          <span>of {progress?.total || 0}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-purple-600 transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {showWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md transition-opacity">
          <div className="w-full max-w-sm rounded-3xl border border-rose-500/30 bg-slate-900 p-8 shadow-[0_0_50px_rgba(244,63,94,0.1)]">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-rose-500/10">
              <FiAlertTriangle className="h-10 w-10 text-rose-500" />
            </div>
            <h3 className="mb-2 text-center text-2xl font-bold text-white">Proctor Warning</h3>
            <p className="mb-6 text-center text-slate-300 leading-relaxed">
              {lastWarningReason}. You have <strong className="text-rose-400">{limitWarnings - warnings}</strong> warnings remaining before automatic disqualification.
            </p>
            <button
              onClick={() => setShowWarningModal(false)}
              className="w-full rounded-xl bg-rose-500 px-6 py-4 font-bold text-white shadow-lg shadow-rose-500/20 transition-all hover:scale-[1.02] hover:bg-rose-400"
            >
              I Understand We Are Recording View
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="flex animate-pulse items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-400">
          <FiAlertTriangle className="h-5 w-5" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Main Question Card */}
      <div className="rounded-3xl border border-slate-700/50 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-xl sm:p-12">
        <h2 className="mb-10 text-2xl font-medium leading-relaxed text-white sm:text-3xl text-balance">
          {question?.text}
        </h2>

        <div className="grid gap-4">
          {question?.options?.map((option, idx) => {
            const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => answer(option.key)}
                disabled={!canAnswer || submitting}
                className="group relative flex w-full items-center gap-4 rounded-2xl border border-slate-700 bg-slate-800/50 p-4 text-left transition-all hover:border-cyan-500/50 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-700/50 text-sm font-bold text-slate-300 transition-colors group-hover:bg-cyan-500/20 group-hover:text-cyan-400">
                  {letters[idx] || option.key}
                </div>
                <span className="text-lg font-medium text-slate-200 group-hover:text-white">
                  {option.text}
                </span>

                {/* Visual indicator on hover */}
                <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-r from-cyan-500/0 via-cyan-500/0 to-cyan-500/5 opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}