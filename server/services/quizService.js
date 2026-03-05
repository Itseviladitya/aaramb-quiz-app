const mongoose = require("mongoose");
const Quiz = require("../models/Quiz");
const Question = require("../models/Question");
const Attempt = require("../models/Attempt");
const User = require("../models/User");

function toObjectId(value) {
  return new mongoose.Types.ObjectId(value);
}

function isQuizWithinSchedule(quiz, now = new Date()) {
  const nowMs = now.getTime();
  const startsAtMs = quiz.startsAt ? new Date(quiz.startsAt).getTime() : null;
  const endsAtMs = quiz.endsAt ? new Date(quiz.endsAt).getTime() : null;

  const afterStart = startsAtMs === null || nowMs >= startsAtMs;
  const beforeEnd = endsAtMs === null || nowMs <= endsAtMs;
  return afterStart && beforeEnd;
}

async function listAvailableQuizzes() {
  const now = new Date();
  return Quiz.find({
    status: "published",
    $or: [{ startsAt: null }, { startsAt: { $lte: now }, endsAt: { $gte: now } }],
  })
    .select("title description timerMode startsAt endsAt quizTimeLimitSec perQuestionTimeLimitSec questionsPerAttempt")
    .sort({ createdAt: -1 })
    .lean();
}

async function startAttempt({ userId, quizId }) {
  const user = await User.findById(userId).lean();
  if (!user || user.isBanned) {
    throw Object.assign(new Error("Banned user cannot attempt quiz"), { status: 403 });
  }

  if (user.disqualifiedQuizIds?.some((id) => id.toString() === quizId)) {
    throw Object.assign(new Error("User is disqualified from this quiz"), { status: 403 });
  }

  const quiz = await Quiz.findById(quizId).lean();
  if (!quiz || quiz.status !== "published" || !isQuizWithinSchedule(quiz)) {
    throw Object.assign(new Error("Quiz is not available right now"), { status: 400 });
  }

  const existing = await Attempt.findOne({ userId, quizId, status: "in_progress" }).lean();
  if (existing) {
    if (existing.isLocked) {
      throw Object.assign(new Error("Your attempt has been locked. Please contact the administrator."), { status: 403 });
    }
    return existing;
  }

  const pool = await Question.aggregate([
    { $match: { quizId: toObjectId(quizId), isActive: true } },
    { $sample: { size: quiz.questionsPerAttempt } },
    { $project: { _id: 1 } },
  ]);

  if (!pool.length) {
    throw Object.assign(new Error("No active questions found for quiz"), { status: 400 });
  }

  return Attempt.create({
    userId,
    quizId,
    assignedQuestionIds: pool.map((entry) => entry._id),
    startedAt: new Date(),
  });
}

async function getCurrentQuestion({ userId, attemptId }) {
  const attempt = await Attempt.findOne({ _id: attemptId, userId }).lean();
  if (!attempt) {
    throw Object.assign(new Error("Attempt not found"), { status: 404 });
  }

  if (attempt.status !== "in_progress") {
    throw Object.assign(new Error("Attempt is not active"), { status: 400 });
  }

  if (attempt.isLocked) {
    throw Object.assign(new Error("Your attempt has been locked. Please contact the administrator."), { status: 403 });
  }

  const quiz = await Quiz.findById(attempt.quizId).lean();
  if (!quiz || quiz.status !== "published" || !isQuizWithinSchedule(quiz)) {
    await Attempt.findByIdAndUpdate(attempt._id, { status: "expired" });
    throw Object.assign(new Error("Quiz is not available, not started yet, or ended"), { status: 409 });
  }

  if (attempt.currentQuestionIndex >= attempt.assignedQuestionIds.length) {
    return { done: true, attemptId: attempt._id };
  }

  const questionId = attempt.assignedQuestionIds[attempt.currentQuestionIndex];
  const question = await Question.findById(questionId).select("text options points timeLimitSecOverride").lean();

  const servedAt = new Date();
  await Attempt.updateOne(
    { _id: attempt._id },
    { $set: { [`questionServedAt.${questionId.toString()}`]: servedAt } }
  );

  return {
    done: false,
    attemptId: attempt._id,
    question: {
      id: question._id,
      text: question.text,
      options: question.options,
      points: question.points,
      timeLimitSec:
        question.timeLimitSecOverride ||
        (quiz.timerMode === "quiz" ? null : quiz.perQuestionTimeLimitSec),
    },
    progress: {
      current: attempt.currentQuestionIndex + 1,
      total: attempt.assignedQuestionIds.length,
    },
    quizTimeLimitSec: quiz.quizTimeLimitSec,
    timerMode: quiz.timerMode,
    limitWarnings: quiz.proctoringLimit || 3,
    isLocked: attempt.isLocked || false,
  };
}

async function submitAnswer({ userId, attemptId, questionId, selectedOptionKey, clientSentAt }) {
  const now = new Date();
  const attempt = await Attempt.findOne({ _id: attemptId, userId });
  if (!attempt || attempt.status !== "in_progress") {
    throw Object.assign(new Error("Active attempt not found"), { status: 404 });
  }

  if (attempt.isLocked) {
    throw Object.assign(new Error("Your attempt has been locked. Please contact the administrator."), { status: 403 });
  }

  const quiz = await Quiz.findById(attempt.quizId).lean();
  if (!quiz || quiz.status !== "published" || !isQuizWithinSchedule(quiz, now)) {
    attempt.status = "expired";
    await attempt.save();
    throw Object.assign(new Error("Quiz is not available, not started yet, or ended"), { status: 409 });
  }

  if (attempt.currentQuestionIndex >= attempt.assignedQuestionIds.length) {
    throw Object.assign(new Error("No questions left"), { status: 400 });
  }

  const expectedQuestionId = attempt.assignedQuestionIds[attempt.currentQuestionIndex].toString();
  if (expectedQuestionId !== questionId) {
    throw Object.assign(new Error("Invalid question sequence"), { status: 400 });
  }

  const alreadyAnswered = attempt.answers.some((entry) => entry.questionId.toString() === questionId);
  if (alreadyAnswered) {
    throw Object.assign(new Error("Question already answered"), { status: 409 });
  }

  const question = await Question.findById(questionId).select("correctOptionKey points timeLimitSecOverride");
  if (!question) {
    throw Object.assign(new Error("Question not found"), { status: 404 });
  }

  const quizElapsedMs = now.getTime() - new Date(attempt.startedAt).getTime();
  if (quiz.timerMode !== "question" && quizElapsedMs > quiz.quizTimeLimitSec * 1000) {
    attempt.status = "expired";
    await attempt.save();
    throw Object.assign(new Error("Quiz timer expired"), { status: 408 });
  }

  const questionServedAt = attempt.questionServedAt.get(questionId);
  if (!questionServedAt) {
    throw Object.assign(new Error("Question timing context missing"), { status: 400 });
  }

  const effectiveQuestionLimitSec =
    question.timeLimitSecOverride ||
    (quiz.timerMode === "quiz" ? Number.MAX_SAFE_INTEGER : quiz.perQuestionTimeLimitSec);

  const responseTimeMs = now.getTime() - new Date(questionServedAt).getTime();
  if (responseTimeMs > effectiveQuestionLimitSec * 1000) {
    attempt.status = "expired";
    await attempt.save();
    throw Object.assign(new Error("Question timer expired"), { status: 408 });
  }

  const skewMs = Math.abs(now.getTime() - new Date(clientSentAt).getTime());
  if (Number.isFinite(skewMs) && skewMs > 20000) {
    attempt.warnings += 1;
  }

  const isCorrect = question.correctOptionKey === selectedOptionKey;
  const awarded = isCorrect ? question.points : 0;

  attempt.answers.push({
    questionId,
    selectedOptionKey,
    isCorrect,
    pointsAwarded: awarded,
    answeredAt: now,
    responseTimeMs,
  });

  attempt.totalScore += awarded;
  attempt.currentQuestionIndex += 1;

  if (attempt.currentQuestionIndex >= attempt.assignedQuestionIds.length) {
    attempt.status = "submitted";
    attempt.submittedAt = now;
  }

  await attempt.save();

  return {
    correct: isCorrect,
    pointsAwarded: awarded,
    finished: attempt.status === "submitted",
    currentScore: attempt.totalScore,
  };
}

async function reportProctorViolation({ userId, attemptId, reason }) {
  const attempt = await Attempt.findOne({ _id: attemptId, userId });
  if (!attempt || attempt.status !== "in_progress" || attempt.isLocked) {
    return;
  }

  const quiz = await Quiz.findById(attempt.quizId).lean();
  const limit = quiz?.proctoringLimit || 3;

  attempt.warnings += 1;
  if (attempt.warnings >= limit) {
    attempt.status = "disqualified";
    attempt.isLocked = true;
    attempt.disqualifyReason = reason || "Multiple proctoring violations";
  }
  await attempt.save();
}

async function lockAttempt({ userId, attemptId }) {
  const attempt = await Attempt.findOne({ _id: attemptId, userId });
  if (!attempt || attempt.status !== "in_progress") {
    return;
  }
  attempt.isLocked = true;
  await attempt.save();
}

module.exports = {
  listAvailableQuizzes,
  startAttempt,
  getCurrentQuestion,
  submitAnswer,
  reportProctorViolation,
  lockAttempt,
};