"use client";

import { useCallback, useMemo, useState } from "react";
import { fetchCurrentQuestion, submitAnswer } from "@/services/quizService";

export function useQuizSession(attemptId) {
  const [state, setState] = useState({
    loading: true,
    submitting: false,
    done: false,
    question: null,
    progress: null,
    quizTimeLimitSec: null,
    timerMode: "quiz",
    score: 0,
    error: "",
  });

  const loadQuestion = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: "" }));
    try {
      const data = await fetchCurrentQuestion(attemptId);
      setState((current) => ({
        ...current,
        loading: false,
        done: data.done,
        question: data.question || null,
        progress: data.progress || null,
        quizTimeLimitSec: data.quizTimeLimitSec || null,
        timerMode: data.timerMode || "quiz",
        limitWarnings: data.limitWarnings || 3,
        isLockedServer: data.isLocked || false,
      }));
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: false,
        error: error.message || "Failed to load question",
      }));
    }
  }, [attemptId]);

  const answer = useCallback(
    async (selectedOptionKey) => {
      if (!state.question || state.submitting) {
        return;
      }

      const optimisticProgress = state.progress
        ? { ...state.progress, current: Math.min(state.progress.current + 1, state.progress.total) }
        : null;

      setState((current) => ({
        ...current,
        submitting: true,
        error: "",
        progress: optimisticProgress || current.progress,
      }));

      try {
        const result = await submitAnswer(attemptId, {
          questionId: state.question.id,
          selectedOptionKey,
          clientSentAt: new Date().toISOString(),
        });

        setState((current) => ({
          ...current,
          submitting: false,
          score: result.currentScore,
          done: result.finished,
        }));

        if (!result.finished) {
          await loadQuestion();
        }
      } catch (error) {
        setState((current) => ({
          ...current,
          submitting: false,
          error: error.message || "Answer submission failed",
        }));
      }
    },
    [attemptId, loadQuestion, state.progress, state.question, state.submitting]
  );

  const canAnswer = useMemo(() => Boolean(state.question && !state.loading && !state.submitting), [state]);

  return {
    ...state,
    canAnswer,
    loadQuestion,
    answer,
  };
}