const Quiz = require("../models/Quiz");
const Question = require("../models/Question");
const User = require("../models/User");
const Attempt = require("../models/Attempt");

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
  return User.find({}).select("name email role isBanned disqualifiedQuizIds createdAt").sort({ createdAt: -1 }).lean();
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
  return User.findByIdAndUpdate(userId, { isBanned: ban }, { returnDocument: "after" }).lean();
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
  const query = { status: { $in: ["submitted", "disqualified", "expired"] } };
  if (filters.quizId) {
    query.quizId = filters.quizId;
  }

  return Attempt.find(query)
    .sort({ submittedAt: -1, updatedAt: -1 })
    .limit(1000)
    .populate("userId", "name email")
    .populate("quizId", "title")
    .lean();
}

function escapeCsv(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function buildResultsCsv(rows) {
  const headers = [
    "Attempt ID",
    "User Name",
    "User Email",
    "Quiz Title",
    "Status",
    "Score",
    "Warnings",
    "Started At",
    "Submitted At",
  ];

  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(
      [
        escapeCsv(row._id),
        escapeCsv(row.userId?.name || ""),
        escapeCsv(row.userId?.email || ""),
        escapeCsv(row.quizId?.title || ""),
        escapeCsv(row.status || ""),
        escapeCsv(row.totalScore ?? 0),
        escapeCsv(row.warnings ?? 0),
        escapeCsv(row.startedAt ? new Date(row.startedAt).toISOString() : ""),
        escapeCsv(row.submittedAt ? new Date(row.submittedAt).toISOString() : ""),
      ].join(",")
    );
  }

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
  buildResultsCsv,
};