const Quiz = require("../models/Quiz");
const Question = require("../models/Question");
const User = require("../models/User");
const Attempt = require("../models/Attempt");
const AdminAuditLog = require("../models/AdminAuditLog");
const ResubmitRequest = require("../models/ResubmitRequest");

function parseDateOrNull(value) {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw Object.assign(new Error("Invalid date/time format"), { status: 400 });
  }
  return parsed;
}

function validateSchedule(startsAt, endsAt) {
  if (startsAt && endsAt && endsAt <= startsAt) {
    throw Object.assign(new Error("End date/time must be greater than start date/time"), { status: 400 });
  }
}

function normalizeProctoringLimit(value, fallback = 3) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.max(1, Math.floor(numeric));
}

async function getDashboardStats() {
  const [users, activeQuizzes, attempts, leaderboardTop] = await Promise.all([
    User.countDocuments({}),
    Quiz.countDocuments({ status: "running" }),
    Attempt.countDocuments({ status: "submitted" }),
    Attempt.find({ status: "submitted" })
      .sort({ totalScore: -1 })
      .limit(10)
      .populate("userId", "name email")
      .populate("quizId", "title")
      .lean(),
  ]);

  return {
    users,
    activeQuizzes,
    completedAttempts: attempts,
    leaderboardTop,
  };
}

async function listUsers() {
  return User.find({})
    .select(
      "name fullName email role isBanned disqualifiedQuizIds profileCompleted branch yearOfStudy studentId phoneNumber lastActiveAt createdAt"
    )
    .sort({ createdAt: -1 })
    .lean();
}

async function deleteUser(userId) {
  const user = await User.findById(userId).lean();
  if (!user) {
    throw Object.assign(new Error("User not found"), { status: 404 });
  }

  await Promise.all([
    Attempt.deleteMany({ userId }),
    User.findByIdAndDelete(userId),
  ]);
}

async function banUser(userId, ban) {
  const user = await User.findById(userId);
  if (!user) {
    throw Object.assign(new Error("User not found"), { status: 404 });
  }

  if (ban && user.role === "admin") {
    throw Object.assign(new Error("Admin users cannot be banned"), { status: 403 });
  }

  user.isBanned = Boolean(ban);
  await user.save();
  return user.toObject();
}

async function disqualifyUserFromQuiz(userId, quizId) {
  return User.findByIdAndUpdate(
    userId,
    { $addToSet: { disqualifiedQuizIds: quizId } },
    { returnDocument: "after" }
  ).lean();
}

async function setUserRole(userId, role) {
  const allowedRoles = ["user", "manager", "admin"];
  if (!allowedRoles.includes(role)) {
    throw Object.assign(new Error("Invalid role"), { status: 400 });
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { role },
    { returnDocument: "after" }
  ).lean();

  if (!user) {
    throw Object.assign(new Error("User not found"), { status: 404 });
  }

  return user;
}

async function createQuiz(payload, adminUserId) {
  if (!payload.startsAt || !payload.endsAt) {
    throw Object.assign(new Error("Quiz start and end date/time are required"), { status: 400 });
  }

  const startsAt = parseDateOrNull(payload.startsAt);
  const endsAt = parseDateOrNull(payload.endsAt);
  validateSchedule(startsAt, endsAt);

  const quiz = await Quiz.create({
    title: payload.title,
    description: payload.description,
    status: payload.status || "draft",
    createdBy: adminUserId,
    questionsPerAttempt: payload.questionsPerAttempt || 20,
    proctoringLimit: normalizeProctoringLimit(payload.proctoringLimit, 3),
    timerMode: payload.timerMode || "quiz",
    startsAt,
    endsAt,
    quizTimeLimitSec: payload.quizTimeLimitSec || 600,
    perQuestionTimeLimitSec: payload.perQuestionTimeLimitSec || 30,
  });

  if (Array.isArray(payload.questions) && payload.questions.length) {
    await Question.insertMany(
      payload.questions.map((q, index) => ({
        quizId: quiz._id,
        text: q.text,
        options: q.options,
        correctOptionKey: q.correctOptionKey,
        points: q.points || 1,
        order: index,
      }))
    );
    await Quiz.findByIdAndUpdate(quiz._id, { totalQuestionPool: payload.questions.length });
  }

  return quiz;
}

async function updateQuiz(quizId, payload) {
  const existingQuiz = await Quiz.findById(quizId);
  if (!existingQuiz) {
    throw Object.assign(new Error("Quiz not found"), { status: 404 });
  }

  const merged = {
    title: payload.title ?? existingQuiz.title,
    description: payload.description ?? existingQuiz.description,
    status: payload.status ?? existingQuiz.status,
    timerMode: payload.timerMode ?? existingQuiz.timerMode,
    quizTimeLimitSec: payload.quizTimeLimitSec ?? existingQuiz.quizTimeLimitSec,
    perQuestionTimeLimitSec: payload.perQuestionTimeLimitSec ?? existingQuiz.perQuestionTimeLimitSec,
    questionsPerAttempt: payload.questionsPerAttempt ?? existingQuiz.questionsPerAttempt,
    proctoringLimit: normalizeProctoringLimit(
      payload.proctoringLimit ?? existingQuiz.proctoringLimit,
      normalizeProctoringLimit(existingQuiz.proctoringLimit, 3)
    ),
    startsAt: payload.startsAt ?? existingQuiz.startsAt,
    endsAt: payload.endsAt ?? existingQuiz.endsAt,
  };

  if (!merged.startsAt || !merged.endsAt) {
    throw Object.assign(new Error("Quiz start and end date/time are required"), { status: 400 });
  }

  const startsAt = parseDateOrNull(merged.startsAt);
  const endsAt = parseDateOrNull(merged.endsAt);
  validateSchedule(startsAt, endsAt);

  const quiz = await Quiz.findByIdAndUpdate(
    quizId,
    {
      title: merged.title,
      description: merged.description,
      status: merged.status,
      timerMode: merged.timerMode,
      startsAt,
      endsAt,
      quizTimeLimitSec: merged.quizTimeLimitSec,
      perQuestionTimeLimitSec: merged.perQuestionTimeLimitSec,
      questionsPerAttempt: merged.questionsPerAttempt,
      proctoringLimit: merged.proctoringLimit,
    },
    { returnDocument: "after" }
  );

  if (Array.isArray(payload.questions)) {
    await Question.deleteMany({ quizId });
    if (payload.questions.length) {
      await Question.insertMany(
        payload.questions.map((q, index) => ({
          quizId,
          text: q.text,
          options: q.options,
          correctOptionKey: q.correctOptionKey,
          points: q.points || 1,
          order: index,
        }))
      );
    }
    await Quiz.findByIdAndUpdate(quizId, { totalQuestionPool: payload.questions.length });
  }

  return quiz;
}

async function deleteQuiz(quizId) {
  await Promise.all([Question.deleteMany({ quizId }), Attempt.deleteMany({ quizId })]);
  await Quiz.findByIdAndDelete(quizId);
}

async function setQuizStatus(quizId, status) {
  if (!["draft", "published"].includes(status)) {
    throw Object.assign(new Error("Invalid status"), { status: 400 });
  }

  const quiz = await Quiz.findByIdAndUpdate(
    quizId,
    { status },
    { returnDocument: "after" }
  ).lean();

  if (!quiz) {
    throw Object.assign(new Error("Quiz not found"), { status: 404 });
  }

  return quiz;
}

async function getQuizWithQuestions(quizId) {
  const [quiz, questions] = await Promise.all([
    Quiz.findById(quizId).lean(),
    Question.find({ quizId }).select("+correctOptionKey").sort({ order: 1 }).lean(),
  ]);

  if (!quiz) {
    throw Object.assign(new Error("Quiz not found"), { status: 404 });
  }

  return {
    ...quiz,
    questions: questions.map((question) => ({
      text: question.text,
      options: question.options,
      correctOptionKey: question.correctOptionKey,
      points: question.points,
      timeLimitSecOverride: question.timeLimitSecOverride,
    })),
  };
}

async function listQuizzesForAdmin() {
  return Quiz.find({}).sort({ createdAt: -1 }).lean();
}

async function listResults(filters = {}) {
  const query = { status: { $in: ["submitted", "disqualified", "expired", "in_progress"] } };
  if (filters.quizId) {
    query.quizId = filters.quizId;
  }

  if (filters.status === "submitted") {
    query.status = "submitted";
  } else if (filters.status === "disqualified") {
    query.status = "disqualified";
  } else if (filters.status === "expired") {
    query.status = "expired";
  } else if (filters.status === "in_progress") {
    query.status = "in_progress";
  }

  if (filters.isLocked === true) {
    query.isLocked = true;
  }

  let sort = { submittedAt: -1, updatedAt: -1 };
  if (filters.sortBy === "rank") {
    sort = { totalScore: -1, submittedAt: 1, createdAt: 1 };
  } else if (filters.sortBy === "score_desc") {
    sort = { totalScore: -1, submittedAt: -1, createdAt: -1 };
  } else if (filters.sortBy === "score_asc") {
    sort = { totalScore: 1, submittedAt: -1, createdAt: -1 };
  } else if (filters.sortBy === "oldest") {
    sort = { createdAt: 1 };
  }

  return Attempt.find(query)
    .sort(sort)
    .limit(1000)
    .populate("userId", "name email fullName branch yearOfStudy studentId phoneNumber")
    .populate("quizId", "title")
    .lean();
}

async function createAuditLog({ actorUserId, actorRole, action, targetType, targetId, details }) {
  await AdminAuditLog.create({
    actorUserId,
    actorRole,
    action,
    targetType,
    targetId: targetId ? String(targetId) : "",
    details: details || {},
  });
}

async function listAuditLogs() {
  return AdminAuditLog.find({ actorRole: "manager" })
    .sort({ createdAt: -1 })
    .limit(500)
    .populate("actorUserId", "name email role")
    .lean();
}

async function createResubmitRequest({ attemptId, userId, reason }) {
  const attempt = await Attempt.findOne({ _id: attemptId, userId }).lean();
  if (!attempt) {
    throw Object.assign(new Error("Attempt not found for this user"), { status: 404 });
  }

  const safeReason = String(reason || "").trim();
  if (safeReason.length < 5) {
    throw Object.assign(new Error("Please provide a clear reason (minimum 5 characters)"), { status: 400 });
  }

  const pending = await ResubmitRequest.findOne({ attemptId, userId, status: "pending" }).lean();
  if (pending) {
    throw Object.assign(new Error("A pending re-submit request already exists for this attempt"), { status: 409 });
  }

  return ResubmitRequest.create({
    attemptId,
    quizId: attempt.quizId,
    userId,
    reason: safeReason,
    status: "pending",
    reviewAction: "reset",
  });
}

async function listResubmitRequests(filters = {}) {
  const query = {};
  if (filters.status && ["pending", "approved", "rejected"].includes(filters.status)) {
    query.status = filters.status;
  }
  if (filters.quizId) {
    query.quizId = filters.quizId;
  }

  return ResubmitRequest.find(query)
    .sort({ status: 1, createdAt: -1 })
    .limit(1000)
    .populate("userId", "name email fullName studentId branch yearOfStudy")
    .populate("quizId", "title")
    .populate("attemptId", "status warnings disqualifyReason totalScore")
    .populate("reviewedBy", "name email role")
    .lean();
}

async function reviewResubmitRequest({ requestId, actorUserId, actorRole, decision, reviewNote }) {
  const request = await ResubmitRequest.findById(requestId);
  if (!request) {
    throw Object.assign(new Error("Re-submit request not found"), { status: 404 });
  }

  if (request.status !== "pending") {
    throw Object.assign(new Error("This request has already been reviewed"), { status: 409 });
  }

  const safeDecision = String(decision || "").toLowerCase();
  if (!["approved", "rejected"].includes(safeDecision)) {
    throw Object.assign(new Error("Invalid decision"), { status: 400 });
  }

  const safeNote = String(reviewNote || "").trim();
  if (safeDecision === "rejected" && safeNote.length < 3) {
    throw Object.assign(new Error("Please add a short review note for rejection"), { status: 400 });
  }

  if (safeDecision === "approved") {
    await Attempt.findByIdAndDelete(request.attemptId);
    request.reviewAction = "reset";
  }

  request.status = safeDecision;
  request.reviewNote = safeNote;
  request.reviewedBy = actorUserId;
  request.reviewedAt = new Date();
  await request.save();

  await createAuditLog({
    actorUserId,
    actorRole,
    action: safeDecision === "approved" ? "RESUBMIT_REQUEST_APPROVED" : "RESUBMIT_REQUEST_REJECTED",
    targetType: "resubmit_request",
    targetId: requestId,
    details: {
      attemptId: String(request.attemptId),
      decision: safeDecision,
      reviewAction: request.reviewAction,
      reviewNote: safeNote,
    },
  });

  return request.toObject();
}

function escapeCsv(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function buildResultsCsv(rows) {
  const headers = [
    "Attempt ID",
    "Rank",
    "User Name",
    "Full Name",
    "User Email",
    "Student ID",
    "Branch",
    "Year",
    "Phone",
    "Quiz Title",
    "Status",
    "Disqualify Reason",
    "Score",
    "Warnings",
    "Started At",
    "Submitted At",
  ];

  const lines = [headers.join(",")];
  const rankingRows = rows
    .filter((row) => row.status === "submitted")
    .slice()
    .sort((a, b) => {
      const scoreDiff = (b.totalScore ?? 0) - (a.totalScore ?? 0);
      if (scoreDiff !== 0) return scoreDiff;
      const aSubmitted = a.submittedAt ? new Date(a.submittedAt).getTime() : Number.MAX_SAFE_INTEGER;
      const bSubmitted = b.submittedAt ? new Date(b.submittedAt).getTime() : Number.MAX_SAFE_INTEGER;
      return aSubmitted - bSubmitted;
    });

  const rankByAttemptId = new Map();
  rankingRows.forEach((row, index) => {
    rankByAttemptId.set(String(row._id), index + 1);
  });

  for (const row of rows) {
    const user = row.userId || {};
    lines.push(
      [
        escapeCsv(row._id),
        escapeCsv(rankByAttemptId.get(String(row._id)) || ""),
        escapeCsv(user.name || ""),
        escapeCsv(user.fullName || ""),
        escapeCsv(user.email || ""),
        escapeCsv(user.studentId || ""),
        escapeCsv(user.branch || ""),
        escapeCsv(user.yearOfStudy ?? ""),
        escapeCsv(user.phoneNumber || ""),
        escapeCsv(row.quizId?.title || ""),
        escapeCsv(row.status || ""),
        escapeCsv(row.disqualifyReason || ""),
        escapeCsv(row.totalScore ?? 0),
        escapeCsv(row.warnings ?? 0),
        escapeCsv(row.startedAt ? new Date(row.startedAt).toISOString() : ""),
        escapeCsv(row.submittedAt ? new Date(row.submittedAt).toISOString() : ""),
      ].join(",")
    );
  }

  return lines.join("\n");
}

function buildRankedResultsCsv(rows) {
  const submittedRows = rows
    .filter((row) => row.status === "submitted")
    .slice()
    .sort((a, b) => {
      const scoreDiff = (b.totalScore ?? 0) - (a.totalScore ?? 0);
      if (scoreDiff !== 0) return scoreDiff;
      const aSubmitted = a.submittedAt ? new Date(a.submittedAt).getTime() : Number.MAX_SAFE_INTEGER;
      const bSubmitted = b.submittedAt ? new Date(b.submittedAt).getTime() : Number.MAX_SAFE_INTEGER;
      return aSubmitted - bSubmitted;
    });

  const headers = [
    "Rank",
    "Attempt ID",
    "User Name",
    "Full Name",
    "User Email",
    "Student ID",
    "Branch",
    "Year",
    "Phone",
    "Quiz Title",
    "Score",
    "Warnings",
    "Disqualify Reason",
    "Started At",
    "Submitted At",
  ];

  const lines = [headers.join(",")];

  submittedRows.forEach((row, index) => {
    const user = row.userId || {};
    lines.push(
      [
        escapeCsv(index + 1),
        escapeCsv(row._id),
        escapeCsv(user.name || ""),
        escapeCsv(user.fullName || ""),
        escapeCsv(user.email || ""),
        escapeCsv(user.studentId || ""),
        escapeCsv(user.branch || ""),
        escapeCsv(user.yearOfStudy ?? ""),
        escapeCsv(user.phoneNumber || ""),
        escapeCsv(row.quizId?.title || ""),
        escapeCsv(row.totalScore ?? 0),
        escapeCsv(row.warnings ?? 0),
        escapeCsv(row.disqualifyReason || ""),
        escapeCsv(row.startedAt ? new Date(row.startedAt).toISOString() : ""),
        escapeCsv(row.submittedAt ? new Date(row.submittedAt).toISOString() : ""),
      ].join(",")
    );
  });

  return lines.join("\n");
}

module.exports = {
  getDashboardStats,
  listUsers,
  deleteUser,
  banUser,
  disqualifyUserFromQuiz,
  setUserRole,
  createQuiz,
  updateQuiz,
  setQuizStatus,
  getQuizWithQuestions,
  deleteQuiz,
  listQuizzesForAdmin,
  listResults,
  createAuditLog,
  listAuditLogs,
  createResubmitRequest,
  listResubmitRequests,
  reviewResubmitRequest,
  buildResultsCsv,
  buildRankedResultsCsv,
};