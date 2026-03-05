"use client";

import { useEffect, useState } from "react";
import { FiDownload, FiEdit2, FiPauseCircle, FiPlayCircle, FiPlusCircle, FiSlash, FiTrash2, FiUserX, FiXCircle } from "react-icons/fi";
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
      {error ? <p className="rounded-md border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4">Users: {stats?.users ?? 0}</div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">Active Quizzes: {stats?.activeQuizzes ?? 0}</div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">Completed Attempts: {stats?.completedAttempts ?? 0}</div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold">{editingQuizId ? "Edit Quiz" : "Create Quiz"}</h2>
        <form onSubmit={onCreateQuiz} className="grid gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm text-zinc-700">
            <span className="font-medium">Quiz Title</span>
            <input
              className="rounded-md border border-zinc-300 px-3 py-2"
              placeholder="e.g. JavaScript Fundamentals"
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-zinc-700">
            <span className="font-medium">Description</span>
            <input
              className="rounded-md border border-zinc-300 px-3 py-2"
              placeholder="Short quiz summary"
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-zinc-700">
            <span className="font-medium">Need Timer Per Question</span>
            <select
              className="rounded-md border border-zinc-300 px-3 py-2"
              value={form.usePerQuestionTimer ? "yes" : "no"}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  usePerQuestionTimer: event.target.value === "yes",
                }))
              }
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-zinc-700">
            <span className="font-medium">Quiz Start Date & Time</span>
            <input
              type="datetime-local"
              className="rounded-md border border-zinc-300 px-3 py-2"
              value={form.startsAt}
              onChange={(event) => setForm((current) => ({ ...current, startsAt: event.target.value }))}
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-zinc-700">
            <span className="font-medium">Quiz End Date & Time</span>
            <input
              type="datetime-local"
              className="rounded-md border border-zinc-300 px-3 py-2"
              value={form.endsAt}
              onChange={(event) => setForm((current) => ({ ...current, endsAt: event.target.value }))}
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-zinc-700">
            <span className="font-medium">Per Question Timer (seconds)</span>
            <input
              type="number"
              className="rounded-md border border-zinc-300 px-3 py-2"
              value={form.perQuestionTimeLimitSec}
              onChange={(event) =>
                setForm((current) => ({ ...current, perQuestionTimeLimitSec: Number(event.target.value) }))
              }
              placeholder="e.g. 30"
              disabled={!form.usePerQuestionTimer}
              required={form.usePerQuestionTimer}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-zinc-700">
            <span className="font-medium">Questions Per User</span>
            <input
              type="number"
              className="rounded-md border border-zinc-300 px-3 py-2"
              value={form.questionsPerAttempt}
              onChange={(event) => setForm((current) => ({ ...current, questionsPerAttempt: Number(event.target.value) }))}
              placeholder="e.g. 20"
              min={1}
              required
            />
          </label>
          <label className="md:col-span-2 flex flex-col gap-1 text-sm text-zinc-700">
            <span className="font-medium">Questions JSON (text, options, correctOptionKey, points, optional timeLimitSecOverride)</span>
            <textarea
              className="min-h-36 rounded-md border border-zinc-300 px-3 py-2 font-mono text-xs"
              value={questionJson}
              onChange={(event) => setQuestionJson(event.target.value)}
              placeholder='[{"text":"Q1","options":[{"key":"A","text":"Option A"}],"correctOptionKey":"A","points":5,"timeLimitSecOverride":20}]'
              required
            />
          </label>
          <div className="flex items-center gap-2">
            <button className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-white">
              <FiPlusCircle /> {editingQuizId ? "Update Quiz" : "Save Quiz"}
            </button>
            {editingQuizId ? (
              <button
                type="button"
                onClick={onCancelEdit}
                className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-zinc-300 bg-white px-4 py-2 text-zinc-700"
              >
                <FiXCircle /> Cancel Edit
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold">Quiz Controls</h2>
        <div className="grid gap-2">
          {quizzes.map((quiz) => (
            <div key={quiz._id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-zinc-200 p-3">
              <div>
                <p className="font-medium">{quiz.title}</p>
                <p className="text-xs text-zinc-500">Status: {quiz.status}</p>
                <p className="text-xs text-zinc-500">
                  Schedule: {quiz.startsAt ? new Date(quiz.startsAt).toLocaleString() : "Immediate"} →{" "}
                  {quiz.endsAt ? new Date(quiz.endsAt).toLocaleString() : "No end"}
                </p>
                <p className="text-xs text-zinc-500">
                  Per-question timer: {quiz.timerMode === "quiz" ? "Off" : `On (${quiz.perQuestionTimeLimitSec}s)`}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onEditQuiz(quiz._id)}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-zinc-300 px-3 py-2 text-sm"
                >
                  <FiEdit2 /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => onSetStatus(quiz, "running")}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-zinc-300 px-3 py-2 text-sm"
                >
                  <FiPlayCircle /> Start
                </button>
                <button
                  type="button"
                  onClick={() => onSetStatus(quiz, "paused")}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-zinc-300 px-3 py-2 text-sm"
                >
                  <FiPauseCircle /> Pause
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteQuiz(quiz._id)}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-rose-300 px-3 py-2 text-sm text-rose-700"
                >
                  <FiTrash2 /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold">User Moderation</h2>
        <div className="space-y-2">
          {users.map((user) => (
            <div key={user._id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-zinc-200 p-3">
              <div>
                <p className="font-medium">{user.name || user.email}</p>
                <p className="text-xs text-zinc-500">{user.email}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onBan(user._id, !user.isBanned)}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-zinc-300 px-3 py-2 text-sm"
                >
                  <FiUserX /> {user.isBanned ? "Unban" : "Ban"}
                </button>
                <label className="flex flex-col gap-1 text-xs text-zinc-600">
                  <span className="font-medium">Disqualify From Quiz</span>
                  <select
                    className="rounded-md border border-zinc-300 px-2 py-2 text-sm"
                    value={disqualifyQuizIdByUser[user._id] || ""}
                    onChange={(event) =>
                      setDisqualifyQuizIdByUser((current) => ({
                        ...current,
                        [user._id]: event.target.value,
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
                </label>
                <button
                  type="button"
                  onClick={() => onDisqualify(user._id)}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-zinc-300 px-3 py-2 text-sm"
                >
                  <FiSlash /> Disqualify
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteUser(user._id)}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-rose-300 px-3 py-2 text-sm text-rose-700"
                >
                  <FiTrash2 /> Delete User
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Results</h2>
          <a
            href="/api/admin/results/export"
            className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-zinc-300 px-3 py-2 text-sm"
          >
            <FiDownload /> Export CSV
          </a>
        </div>

        <div className="overflow-auto rounded-md border border-zinc-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-600">
              <tr>
                <th className="px-3 py-2">User</th>
                <th className="px-3 py-2">Quiz</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Score</th>
                <th className="px-3 py-2">Warnings</th>
                <th className="px-3 py-2">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {!results.length ? (
                <tr>
                  <td colSpan={6} className="px-3 py-5 text-center text-zinc-500">
                    No results yet.
                  </td>
                </tr>
              ) : null}
              {results.map((row) => (
                <tr key={row._id} className="border-t border-zinc-100">
                  <td className="px-3 py-2">{row.userId?.name || row.userId?.email || "Unknown"}</td>
                  <td className="px-3 py-2">{row.quizId?.title || "Unknown"}</td>
                  <td className="px-3 py-2">{row.status}</td>
                  <td className="px-3 py-2">{row.totalScore ?? 0}</td>
                  <td className="px-3 py-2">{row.warnings ?? 0}</td>
                  <td className="px-3 py-2">{row.submittedAt ? new Date(row.submittedAt).toLocaleString() : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}