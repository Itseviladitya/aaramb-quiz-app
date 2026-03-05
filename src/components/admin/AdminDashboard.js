"use client";

import { useEffect, useState } from "react";
import {
  FiDownload,
  FiEdit2,
  FiPauseCircle,
  FiPlayCircle,
  FiPlusCircle,
  FiSlash,
  FiTrash2,
  FiUserX,
  FiXCircle,
  FiUsers,
  FiActivity,
  FiCheckSquare,
  FiSettings,
  FiFileText,
  FiClock,
  FiHash,
  FiAlertTriangle,
  FiList,
} from "react-icons/fi";
import {
  createQuiz,
  deleteQuiz,
  deleteUser,
  disqualifyUser,
  fetchAdminQuizDetail,
  fetchAdminQuizzes,
  fetchAdminResults,
  fetchAdminStats,
  fetchAdminUsers,
  setUserBan,
  updateQuiz,
  updateQuizStatus,
  unlockAttempt,
  resetAttempt,
} from "@/services/adminService";

const emptyForm = {
  title: "",
  description: "",
  status: "draft",
  usePerQuestionTimer: true,
  startsAt: "",
  endsAt: "",
  perQuestionTimeLimitSec: 30,
  questionsPerAttempt: 20,
  proctoringLimit: 3,
  questions: [],
};

function toIsoOrEmpty(value) {
  if (!value) {
    return "";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }
  return parsed.toISOString();
}

function toLocalInputValue(value) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

// Reusable input class
const inputClass =
  "rounded-xl border border-slate-600/50 bg-slate-700/50 px-4 py-2.5 text-sm text-white placeholder-slate-500 transition-colors focus:border-cyan-500/50 focus:bg-slate-700";
const selectClass =
  "rounded-xl border border-slate-600/50 bg-slate-700/50 px-4 py-2.5 text-sm text-white transition-colors focus:border-cyan-500/50 focus:bg-slate-700";
const btnOutline =
  "inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-600/50 bg-slate-700/30 px-3.5 py-2 text-sm font-medium text-slate-300 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white";
const btnDanger =
  "inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-950/30 px-3.5 py-2 text-sm font-medium text-rose-400 transition-all hover:border-rose-500/50 hover:bg-rose-950/50";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [users, setUsers] = useState([]);
  const [results, setResults] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [questionJson, setQuestionJson] = useState("[]");
  const [disqualifyQuizIdByUser, setDisqualifyQuizIdByUser] = useState({});
  const [editingQuizId, setEditingQuizId] = useState("");
  const [error, setError] = useState("");

  async function loadAll() {
    try {
      const [s, q, u, r] = await Promise.all([
        fetchAdminStats(),
        fetchAdminQuizzes(),
        fetchAdminUsers(),
        fetchAdminResults(),
      ]);
      setStats(s);
      setQuizzes(q.quizzes || []);
      setUsers(u.users || []);
      setResults(r.rows || []);
    } catch (err) {
      setError(err.message || "Failed to load admin dashboard");
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      loadAll();
    });
  }, []);

  async function onCreateQuiz(event) {
    event.preventDefault();
    try {
      if (!form.startsAt || !form.endsAt) {
        setError("Quiz start and end date/time are required");
        return;
      }

      if (new Date(form.endsAt).getTime() <= new Date(form.startsAt).getTime()) {
        setError("Quiz end date/time must be later than start date/time");
        return;
      }

      const parsedQuestions = JSON.parse(questionJson || "[]");
      const payload = {
        ...form,
        timerMode: form.usePerQuestionTimer ? "question" : "quiz",
        quizTimeLimitSec: 3600,
        perQuestionTimeLimitSec: form.usePerQuestionTimer ? Number(form.perQuestionTimeLimitSec || 30) : 30,
        questionsPerAttempt: Number(form.questionsPerAttempt || 20),
        proctoringLimit: Number(form.proctoringLimit || 3),
        startsAt: toIsoOrEmpty(form.startsAt),
        endsAt: toIsoOrEmpty(form.endsAt),
        questions: parsedQuestions,
      };

      if (editingQuizId) {
        await updateQuiz(editingQuizId, payload);
      } else {
        await createQuiz(payload);
      }
      setForm(emptyForm);
      setQuestionJson("[]");
      setEditingQuizId("");
      setError("");
      await loadAll();
    } catch (err) {
      setError(err.message || "Unable to create quiz");
    }
  }

  async function onSetStatus(quiz, status) {
    try {
      await updateQuizStatus(quiz._id, status);
      await loadAll();
    } catch (err) {
      setError(err.message || "Unable to update quiz status");
    }
  }

  async function onDeleteQuiz(quizId) {
    try {
      await deleteQuiz(quizId);
      await loadAll();
    } catch (err) {
      setError(err.message || "Unable to delete quiz");
    }
  }

  async function onEditQuiz(quizId) {
    try {
      const detail = await fetchAdminQuizDetail(quizId);
      const quiz = detail.quiz;
      setEditingQuizId(quiz._id);
      setForm({
        title: quiz.title || "",
        description: quiz.description || "",
        status: quiz.status || "draft",
        usePerQuestionTimer: quiz.timerMode !== "quiz",
        startsAt: toLocalInputValue(quiz.startsAt),
        endsAt: toLocalInputValue(quiz.endsAt),
        perQuestionTimeLimitSec: quiz.perQuestionTimeLimitSec || 30,
        questionsPerAttempt: quiz.questionsPerAttempt || 20,
        proctoringLimit: quiz.proctoringLimit || 3,
      });
      setQuestionJson(JSON.stringify(quiz.questions || [], null, 2));
    } catch (err) {
      setError(err.message || "Unable to load quiz for editing");
    }
  }

  function onCancelEdit() {
    setEditingQuizId("");
    setForm(emptyForm);
    setQuestionJson("[]");
  }

  async function onBan(userId, isBanned) {
    try {
      await setUserBan(userId, isBanned);
      await loadAll();
    } catch (err) {
      setError(err.message || "Unable to update user status");
    }
  }

  async function onDeleteUser(userId) {
    try {
      await deleteUser(userId);
      await loadAll();
    } catch (err) {
      setError(err.message || "Unable to delete user");
    }
  }

  async function onDisqualify(userId) {
    const quizId = disqualifyQuizIdByUser[userId];
    if (!quizId) {
      setError("Select a quiz for disqualification");
      return;
    }

    try {
      await disqualifyUser(userId, quizId);
      await loadAll();
    } catch (err) {
      setError(err.message || "Unable to disqualify user");
    }
  }

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <header className="relative overflow-hidden rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 p-6 md:p-8 shadow-xl">
        <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="relative z-10">
          <p className="text-sm font-medium text-amber-400">Admin Panel</p>
          <h1 className="mt-1 text-2xl font-extrabold text-white md:text-3xl">
            Aarambh Quiz Administration
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Manage quizzes, users, and view results for the platform.
          </p>
        </div>
      </header>

      {/* ─── Error ─── */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-950/30 p-4 text-sm text-rose-300">
          <FiAlertTriangle className="h-4 w-4 flex-shrink-0" />
          {error}
          <button
            type="button"
            onClick={() => setError("")}
            className="ml-auto text-rose-400 hover:text-rose-300"
          >
            <FiXCircle className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ─── Stats ─── */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10">
              <FiUsers className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-white">{stats?.users ?? 0}</p>
              <p className="text-xs text-slate-500">Registered Users</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
              <FiActivity className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-white">{stats?.activeQuizzes ?? 0}</p>
              <p className="text-xs text-slate-500">Active Quizzes</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10">
              <FiCheckSquare className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-white">{stats?.completedAttempts ?? 0}</p>
              <p className="text-xs text-slate-500">Completed Attempts</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Quiz Form ─── */}
      <section className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-6 md:p-8 shadow-sm">
        <h2 className="mb-6 text-lg font-bold text-white flex items-center gap-2">
          {editingQuizId ? (
            <><FiEdit2 className="h-5 w-5 text-amber-400" /> Edit Quiz</>
          ) : (
            <><FiPlusCircle className="h-5 w-5 text-cyan-400" /> Create Quiz</>
          )}
        </h2>

        <form onSubmit={onCreateQuiz} className="grid gap-5 md:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="flex items-center gap-1.5 text-sm font-medium text-slate-300">
              <FiFileText className="h-3.5 w-3.5 text-slate-500" />
              Quiz Title
            </span>
            <input
              className={inputClass}
              placeholder="e.g. JavaScript Fundamentals"
              value={form.title}
              onChange={(e) => setForm((c) => ({ ...c, title: e.target.value }))}
              required
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="flex items-center gap-1.5 text-sm font-medium text-slate-300">
              <FiFileText className="h-3.5 w-3.5 text-slate-500" />
              Description
            </span>
            <input
              className={inputClass}
              placeholder="Short quiz summary"
              value={form.description}
              onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))}
              required
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="flex items-center gap-1.5 text-sm font-medium text-slate-300">
              <FiClock className="h-3.5 w-3.5 text-slate-500" />
              Per-Question Timer
            </span>
            <select
              className={selectClass}
              value={form.usePerQuestionTimer ? "yes" : "no"}
              onChange={(e) =>
                setForm((c) => ({
                  ...c,
                  usePerQuestionTimer: e.target.value === "yes",
                }))
              }
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="flex items-center gap-1.5 text-sm font-medium text-slate-300">
              <FiClock className="h-3.5 w-3.5 text-slate-500" />
              Timer Duration (seconds)
            </span>
            <input
              type="number"
              className={inputClass}
              value={form.perQuestionTimeLimitSec}
              onChange={(e) =>
                setForm((c) => ({ ...c, perQuestionTimeLimitSec: Number(e.target.value) }))
              }
              placeholder="e.g. 30"
              disabled={!form.usePerQuestionTimer}
              required={form.usePerQuestionTimer}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="flex items-center gap-1.5 text-sm font-medium text-slate-300">
              <FiClock className="h-3.5 w-3.5 text-slate-500" />
              Quiz Start Date & Time
            </span>
            <input
              type="datetime-local"
              className={inputClass}
              value={form.startsAt}
              onChange={(e) => setForm((c) => ({ ...c, startsAt: e.target.value }))}
              required
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="flex items-center gap-1.5 text-sm font-medium text-slate-300">
              <FiClock className="h-3.5 w-3.5 text-slate-500" />
              Quiz End Date & Time
            </span>
            <input
              type="datetime-local"
              className={inputClass}
              value={form.endsAt}
              onChange={(e) => setForm((c) => ({ ...c, endsAt: e.target.value }))}
              required
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="flex items-center gap-1.5 text-sm font-medium text-slate-300">
              <FiHash className="h-3.5 w-3.5 text-slate-500" />
              Questions Per User
            </span>
            <input
              type="number"
              className={inputClass}
              value={form.questionsPerAttempt}
              onChange={(e) => setForm((c) => ({ ...c, questionsPerAttempt: Number(e.target.value) }))}
              placeholder="e.g. 20"
              min={1}
              required
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="flex items-center gap-1.5 text-sm font-medium text-slate-300">
              <FiAlertTriangle className="h-3.5 w-3.5 text-slate-500" />
              Proctoring Limit (Violations)
            </span>
            <input
              type="number"
              className={inputClass}
              value={form.proctoringLimit}
              onChange={(e) => setForm((c) => ({ ...c, proctoringLimit: Number(e.target.value) }))}
              placeholder="e.g. 3"
              min={1}
              required
            />
          </label>

          <label className="md:col-span-2 flex flex-col gap-1.5">
            <span className="flex items-center gap-1.5 text-sm font-medium text-slate-300">
              <FiList className="h-3.5 w-3.5 text-slate-500" />
              Questions JSON
            </span>
            <textarea
              className={`${inputClass} min-h-36 font-mono text-xs`}
              value={questionJson}
              onChange={(e) => setQuestionJson(e.target.value)}
              placeholder='[{"text":"Q1","options":[{"key":"A","text":"Option A"}],"correctOptionKey":"A","points":5}]'
              required
            />
          </label>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all hover:shadow-cyan-500/30"
            >
              <FiPlusCircle className="h-4 w-4" />
              {editingQuizId ? "Update Quiz" : "Save Quiz"}
            </button>
            {editingQuizId && (
              <button type="button" onClick={onCancelEdit} className={btnOutline}>
                <FiXCircle className="h-4 w-4" />
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      {/* ─── Quiz Controls ─── */}
      <section className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-6 md:p-8 shadow-sm">
        <h2 className="mb-5 text-lg font-bold text-white flex items-center gap-2">
          <FiSettings className="h-5 w-5 text-cyan-400" />
          Quiz Controls
        </h2>

        {!quizzes.length ? (
          <div className="rounded-xl border border-slate-700/30 bg-slate-900/40 p-6 text-center">
            <p className="text-sm text-slate-400">No quizzes created yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {quizzes.map((quiz) => (
              <div
                key={quiz._id}
                className="flex flex-col gap-4 rounded-xl border border-slate-700/30 bg-slate-900/30 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-white truncate">{quiz.title}</p>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-semibold ${quiz.status === "published"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-slate-500/10 text-slate-400"
                      }`}>
                      {quiz.status}
                    </span>
                    <span className="text-slate-600">
                      {quiz.startsAt ? new Date(quiz.startsAt).toLocaleString() : "Immediate"} → {quiz.endsAt ? new Date(quiz.endsAt).toLocaleString() : "No end"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">
                    Timer: {quiz.timerMode === "quiz" ? "Off" : `${quiz.perQuestionTimeLimitSec}s per question`} | Limit: {quiz.proctoringLimit || 3}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => onEditQuiz(quiz._id)} className={btnOutline}>
                    <FiEdit2 className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button type="button" onClick={() => onSetStatus(quiz, quiz.status === "published" ? "draft" : "published")} className={btnOutline}>
                    {quiz.status === "published" ? (
                      <><FiPauseCircle className="h-3.5 w-3.5 text-amber-400" /> Unpublish</>
                    ) : (
                      <><FiPlayCircle className="h-3.5 w-3.5 text-emerald-400" /> Publish</>
                    )}
                  </button>
                  <button type="button" onClick={() => onDeleteQuiz(quiz._id)} className={btnDanger}>
                    <FiTrash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ─── User Moderation ─── */}
      <section className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-6 md:p-8 shadow-sm">
        <h2 className="mb-5 text-lg font-bold text-white flex items-center gap-2">
          <FiUsers className="h-5 w-5 text-cyan-400" />
          User Moderation
        </h2>

        {!users.length ? (
          <div className="rounded-xl border border-slate-700/30 bg-slate-900/40 p-6 text-center">
            <p className="text-sm text-slate-400">No registered users yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((user) => (
              <div
                key={user._id}
                className="flex flex-col gap-4 rounded-xl border border-slate-700/30 bg-slate-900/30 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-white truncate">
                    {user.name || user.email}
                    {user.isBanned && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-semibold text-rose-400">
                        Banned
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onBan(user._id, !user.isBanned)}
                    className={user.isBanned ? btnOutline : btnDanger}
                  >
                    <FiUserX className="h-3.5 w-3.5" />
                    {user.isBanned ? "Unban" : "Ban"}
                  </button>

                  <select
                    className={`${selectClass} !py-2 text-xs`}
                    value={disqualifyQuizIdByUser[user._id] || ""}
                    onChange={(e) =>
                      setDisqualifyQuizIdByUser((c) => ({
                        ...c,
                        [user._id]: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select quiz</option>
                    {quizzes.map((quiz) => (
                      <option key={quiz._id} value={quiz._id}>
                        {quiz.title}
                      </option>
                    ))}
                  </select>

                  <button type="button" onClick={() => onDisqualify(user._id)} className={btnOutline}>
                    <FiSlash className="h-3.5 w-3.5 text-amber-400" /> Disqualify
                  </button>

                  <button type="button" onClick={() => onDeleteUser(user._id)} className={btnDanger}>
                    <FiTrash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ─── Results ─── */}
      <section className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-6 md:p-8 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FiCheckSquare className="h-5 w-5 text-cyan-400" />
            Results
          </h2>
          <a
            href="/api/admin/results/export"
            className={btnOutline}
          >
            <FiDownload className="h-3.5 w-3.5" />
            Export CSV
          </a>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-700/30">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 bg-slate-900/50">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">User</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Quiz</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Status</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Score</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Warnings</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Submitted</th>
                <th className="px-4 py-3 text-xs text-right font-semibold uppercase tracking-wider text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!results.length ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                    No results yet.
                  </td>
                </tr>
              ) : null}
              {results.map((row) => (
                <tr key={row._id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-white">
                    {row.userId?.name || row.userId?.email || "Unknown"}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400">
                    {row.quizId?.title || "Unknown"}
                    {row.isLocked && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold text-rose-400">
                        Locked
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${row.status === "submitted"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : row.status === "in-progress"
                        ? "bg-amber-500/10 text-amber-400"
                        : row.status === "disqualified"
                          ? "bg-rose-500/10 text-rose-400"
                          : "bg-slate-500/10 text-slate-400"
                      }`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-sm font-bold text-cyan-400">
                      {row.totalScore ?? 0}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {(row.warnings ?? 0) > 0 ? (
                      <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
                        {row.warnings}
                      </span>
                    ) : (
                      <span className="text-sm text-slate-600">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {row.submittedAt ? new Date(row.submittedAt).toLocaleString() : "-"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {(row.status === "disqualified" || row.status === "in_progress" || row.isLocked) && (
                        <button
                          type="button"
                          title="Unlock/Resume Attempt"
                          onClick={async () => {
                            try {
                              await unlockAttempt(row._id);
                              await loadAll();
                            } catch (err) {
                              setError(err.message || "Failed to unlock");
                            }
                          }}
                          className="inline-flex items-center rounded-lg bg-emerald-500/10 p-2 text-emerald-400 transition-colors hover:bg-emerald-500/20"
                        >
                          <FiPlayCircle className="h-4 w-4" />
                        </button>
                      )}

                      <button
                        type="button"
                        title="Delete Attempt (Allow Re-attempt)"
                        onClick={async () => {
                          if (!window.confirm("Are you sure you want to delete this attempt? This lets the user start over.")) return;
                          try {
                            await resetAttempt(row._id);
                            await loadAll();
                          } catch (err) {
                            setError(err.message || "Failed to delete attempt");
                          }
                        }}
                        className="inline-flex items-center rounded-lg bg-rose-500/10 p-2 text-rose-400 transition-colors hover:bg-rose-500/20"
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}