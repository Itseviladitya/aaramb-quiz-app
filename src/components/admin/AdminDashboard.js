"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { FiAlertTriangle, FiXCircle } from "react-icons/fi";
import {
  createQuiz,
  deleteQuiz,
  deleteUser,
  disqualifyUser,
  fetchAdminQuizDetail,
  fetchAdminQuizzes,
  fetchAdminAuditLogs,
  fetchAdminResubmitRequests,
  fetchAdminResults,
  fetchAdminStats,
  fetchAdminUsers,
  reviewAdminResubmitRequest,
  setUserRole,
  setUserBan,
  updateQuiz,
  updateQuizStatus,
  unlockAttempt,
  resetAttempt,
} from "@/services/adminService";

import AdminOverviewTab from "./AdminOverviewTab";
import AdminQuizzesTab from "./AdminQuizzesTab";
import AdminUsersTab from "./AdminUsersTab";
import AdminResultsTab from "./AdminResultsTab";
import AdminAuditLogsTab from "./AdminAuditLogsTab";

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
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString();
}

function toLocalInputValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function normalizePositiveInt(value, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(1, Math.floor(numeric));
}

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("overview"); // overview, quizzes, users, results
  const [isLoading, setIsLoading] = useState(true);
  const [isSlowLoading, setIsSlowLoading] = useState(false);

  const [stats, setStats] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [users, setUsers] = useState([]);
  const [results, setResults] = useState([]);
  const [resubmitRequests, setResubmitRequests] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [questionJson, setQuestionJson] = useState("[]");
  const [disqualifyQuizIdByUser, setDisqualifyQuizIdByUser] = useState({});
  const [editingQuizId, setEditingQuizId] = useState("");
  const [error, setError] = useState("");

  const isAdmin = session?.user?.role === "admin";
  const canCreateQuiz = isAdmin;
  const canDeleteUser = isAdmin;
  const canManageQuiz = isAdmin;
  const canManageRoles = isAdmin;

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    setIsSlowLoading(false);
    try {
      const [s, q, u, r, req, logsResponse] = await Promise.all([
        fetchAdminStats(),
        fetchAdminQuizzes(),
        fetchAdminUsers(),
        fetchAdminResults(),
        fetchAdminResubmitRequests(),
        fetchAdminAuditLogs(),
      ]);
      setStats(s);
      setQuizzes(q.quizzes || []);
      setUsers(u.users || []);
      setResults(r.rows || []);
      setResubmitRequests(req.rows || []);
      setAuditLogs(logsResponse.rows || []);
    } catch (err) {
      setError(err.message || "Failed to load admin dashboard");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      loadAll();
    });
  }, [loadAll]);

  useEffect(() => {
    if (!isLoading) return;
    const timer = setTimeout(() => setIsSlowLoading(true), 5000);
    return () => clearTimeout(timer);
  }, [isLoading]);

  async function onCreateQuiz(event) {
    event.preventDefault();
    try {
      if (!canCreateQuiz) {
        setError("Manager role is not allowed to create quizzes");
        return false;
      }
      if (!form.startsAt || !form.endsAt) {
        setError("Quiz start and end date/time are required");
        return false;
      }
      if (new Date(form.endsAt).getTime() <= new Date(form.startsAt).getTime()) {
        setError("Quiz end date/time must be later than start date/time");
        return false;
      }

      const parsedQuestions = JSON.parse(questionJson || "[]");
      const payload = {
        ...form,
        timerMode: form.usePerQuestionTimer ? "question" : "quiz",
        quizTimeLimitSec: 3600,
        perQuestionTimeLimitSec: form.usePerQuestionTimer ? Number(form.perQuestionTimeLimitSec || 30) : 30,
        questionsPerAttempt: Number(form.questionsPerAttempt || 20),
        proctoringLimit: normalizePositiveInt(form.proctoringLimit, 3),
        startsAt: toIsoOrEmpty(form.startsAt),
        endsAt: toIsoOrEmpty(form.endsAt),
        questions: parsedQuestions,
      };

      if (editingQuizId) {
        await updateQuiz(editingQuizId, payload);
        setEditingQuizId("");
      } else {
        await createQuiz(payload);
        setForm(emptyForm);
        setQuestionJson("[]");
      }
      setError("");
      await loadAll();
      return true;
    } catch (err) {
      setError(err.message || "Unable to create quiz");
      return false;
    }
  }

  async function onSetStatus(quiz, status) {
    try {
      if (!canManageQuiz) {
        setError("Manager role is not allowed to edit quiz status");
        return;
      }
      await updateQuizStatus(quiz._id, status);
      await loadAll();
    } catch (err) {
      setError(err.message || "Unable to update quiz status");
    }
  }

  async function onDeleteQuiz(quizId) {
    if (!window.confirm("Are you sure you want to delete this quiz completely?")) return;
    try {
      if (!canManageQuiz) {
        setError("Manager role is not allowed to delete quizzes");
        return;
      }
      await deleteQuiz(quizId);
      await loadAll();
    } catch (err) {
      setError(err.message || "Unable to delete quiz");
    }
  }

  async function onEditQuiz(quizId) {
    try {
      if (!canManageQuiz) {
        setError("Manager role is not allowed to edit quizzes");
        return;
      }
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
        proctoringLimit: quiz.proctoringLimit ?? 3,
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
    if (!window.confirm("Delete this user?")) return;
    try {
      if (!canDeleteUser) {
        setError("Manager role is not allowed to delete users");
        return;
      }
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

  async function onSetRole(userId, role) {
    try {
      if (!canManageRoles) {
        setError("Only admin can change user roles");
        return;
      }
      await setUserRole(userId, role);
      await loadAll();
    } catch (err) {
      setError(err.message || "Unable to update user role");
    }
  }

  async function handleUnlockAttempt(attemptId) {
    try {
      await unlockAttempt(attemptId);
      await loadAll();
    } catch (err) {
      setError(err.message || "Failed to unlock attempt");
    }
  }

  async function handleResetAttempt(attemptId) {
    try {
      await resetAttempt(attemptId);
      await loadAll();
    } catch (err) {
      setError(err.message || "Failed to delete attempt");
    }
  }

  async function handleReviewResubmitRequest(requestId, decision, reviewNote) {
    try {
      await reviewAdminResubmitRequest(requestId, { decision, reviewNote });
      await loadAll();
    } catch (err) {
      setError(err.message || "Failed to review re-submit request");
    }
  }

  const tabs = [
    { id: "overview", label: "Dashboard" },
    { id: "quizzes", label: "Quizzes" },
    { id: "users", label: "Users" },
    { id: "results", label: "Results & Requests" },
    { id: "auditLogs", label: "Manager Logs" },
  ];

  if (isLoading && !stats) {
    return (
      <div className="rounded-2xl border border-slate-700/50 bg-slate-900/50 p-10 text-center shadow-xl">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-500" />
        <p className="mt-4 text-sm font-medium text-slate-300">Loading admin panel data...</p>
        {isSlowLoading ? (
          <p className="mt-2 text-xs text-amber-300">
            This is taking longer than expected. Network may be slow.
          </p>
        ) : null}
        <button
          type="button"
          onClick={loadAll}
          className="mt-5 inline-flex cursor-pointer items-center rounded-lg border border-slate-600/50 bg-slate-800/60 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700"
        >
          Retry Loading
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <header className="relative overflow-hidden rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 p-6 md:p-8 shadow-xl">
        <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-sm font-medium text-amber-400">Admin Panel</p>
            <h1 className="mt-1 text-2xl font-extrabold text-white md:text-3xl">
              Aarambh Quiz Administration
            </h1>
            <div className="mt-2 inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-300">
              Role: {session?.user?.role || "user"}
            </div>
            <p className="mt-2 text-sm text-slate-400 max-w-lg">
              Manage robust configurations, oversee active users, and manually review/forgive proctoring violations.
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex bg-slate-900/50 p-1.5 rounded-xl border border-white/5 w-fit">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`cursor-pointer px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === tab.id
                    ? "bg-slate-700 shadow flex-1 text-white"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ─── Global Error ─── */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-950/30 p-4 text-sm text-rose-300">
          <FiAlertTriangle className="h-4 w-4 flex-shrink-0" />
          {error}
          <button
            type="button"
            onClick={() => setError("")}
            className="ml-auto cursor-pointer text-rose-400 hover:text-rose-300"
          >
            <FiXCircle className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ─── Tab Content ─── */}
      {activeTab === "overview" && (
        <AdminOverviewTab stats={stats} />
      )}

      {activeTab === "quizzes" && (
        <AdminQuizzesTab
          quizzes={quizzes}
          canCreateQuiz={canCreateQuiz}
          canManageQuiz={canManageQuiz}
          form={form}
          setForm={setForm}
          questionJson={questionJson}
          setQuestionJson={setQuestionJson}
          onCreateQuiz={onCreateQuiz}
          onSetStatus={onSetStatus}
          onDeleteQuiz={onDeleteQuiz}
          onEditQuiz={onEditQuiz}
          onCancelEdit={onCancelEdit}
          editingQuizId={editingQuizId}
        />
      )}

      {activeTab === "users" && (
        <AdminUsersTab
          users={users}
          quizzes={quizzes}
          canDeleteUser={canDeleteUser}
          canManageRoles={canManageRoles}
          disqualifyQuizIdByUser={disqualifyQuizIdByUser}
          setDisqualifyQuizIdByUser={setDisqualifyQuizIdByUser}
          onBan={onBan}
          onSetRole={onSetRole}
          onDisqualify={onDisqualify}
          onDeleteUser={onDeleteUser}
        />
      )}

      {activeTab === "results" && (
        <AdminResultsTab
          results={results}
          resubmitRequests={resubmitRequests}
          quizzes={quizzes}
          onUnlockAttempt={handleUnlockAttempt}
          onResetAttempt={handleResetAttempt}
          onReviewResubmitRequest={handleReviewResubmitRequest}
        />
      )}

      {activeTab === "auditLogs" && (
        <AdminAuditLogsTab rows={auditLogs} />
      )}

    </div>
  );
}