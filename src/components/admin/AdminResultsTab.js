import { useMemo, useState } from "react";
import {
  FiCheckSquare,
  FiDownload,
  FiPlayCircle,
  FiTrash2,
  FiSearch,
  FiFilter,
  FiRefreshCw,
} from "react-icons/fi";

const selectClass =
  "rounded-xl border border-slate-600/50 bg-slate-700/50 px-4 py-2.5 text-sm text-white transition-colors focus:border-cyan-500/50 focus:bg-slate-700";
const inputClass =
  "rounded-xl border border-slate-600/50 bg-slate-900/50 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none";
const btnOutline =
  "inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-600/50 bg-slate-700/30 px-3.5 py-2 text-sm font-medium text-slate-300 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white";
const btnSuccess =
  "inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-sm font-medium text-emerald-300 transition-all hover:bg-emerald-500/20";
const btnDanger =
  "inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-sm font-medium text-rose-300 transition-all hover:bg-rose-500/20";

export default function AdminResultsTab({
  results,
  resubmitRequests,
  quizzes,
  onUnlockAttempt,
  onResetAttempt,
  onReviewResubmitRequest,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [exportQuizId, setExportQuizId] = useState("all");
  const [exportStatus, setExportStatus] = useState("joined");
  const [exportSortBy, setExportSortBy] = useState("latest");

  const [requestStatusFilter, setRequestStatusFilter] = useState("pending");
  const [reviewNotes, setReviewNotes] = useState({});
  const [workingRequestId, setWorkingRequestId] = useState("");

  const filteredExportHref = useMemo(() => {
    const params = new URLSearchParams();
    if (exportQuizId !== "all") params.set("quizId", exportQuizId);
    if (exportStatus !== "all") params.set("status", exportStatus);
    if (exportSortBy !== "latest") params.set("sortBy", exportSortBy);
    return `/api/admin/results/export${params.toString() ? `?${params.toString()}` : ""}`;
  }, [exportQuizId, exportStatus, exportSortBy]);

  const rankedExportHref = useMemo(() => {
    const params = new URLSearchParams();
    params.set("mode", "ranked");
    if (exportQuizId !== "all") params.set("quizId", exportQuizId);
    return `/api/admin/results/export?${params.toString()}`;
  }, [exportQuizId]);

  const filteredResults = useMemo(() => {
    return (results || []).filter((row) => {
      const userStr = `${row.userId?.name || ""} ${row.userId?.email || ""}`.toLowerCase();
      const quizStr = (row.quizId?.title || "").toLowerCase();
      const matchesSearch =
        userStr.includes(searchQuery.toLowerCase()) || quizStr.includes(searchQuery.toLowerCase());

      const matchesFilter =
        statusFilter === "all"
          ? true
          : statusFilter === "locked"
            ? row.isLocked
            : statusFilter === "disqualified"
              ? row.status === "disqualified"
              : statusFilter === "submitted"
                ? row.status === "submitted"
                : statusFilter === "in_progress"
                  ? row.status === "in_progress"
                  : true;

      return matchesSearch && matchesFilter;
    });
  }, [results, searchQuery, statusFilter]);

  const filteredRequests = useMemo(() => {
    return (resubmitRequests || []).filter((entry) => {
      if (requestStatusFilter === "all") return true;
      return entry.status === requestStatusFilter;
    });
  }, [resubmitRequests, requestStatusFilter]);

  async function handleReview(requestId, decision) {
    const reviewNote = reviewNotes[requestId] || "";
    setWorkingRequestId(requestId);
    try {
      await onReviewResubmitRequest(requestId, decision, reviewNote);
      setReviewNotes((current) => ({ ...current, [requestId]: "" }));
    } finally {
      setWorkingRequestId("");
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-6 md:p-8 shadow-sm">
        <h2 className="mb-1 text-lg font-bold text-white flex items-center gap-2">
          <FiCheckSquare className="h-5 w-5 text-cyan-400" />
          Results & Requests
        </h2>
        <p className="text-xs text-slate-400">
          Export quiz data cleanly and review user re-submit requests due to technical glitches.
        </p>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
            <p className="text-sm font-semibold text-cyan-300">Quiz Result Export</p>
            <p className="mt-1 text-xs text-slate-400">
              Select one quiz and download exactly what you need: joined, submitted, disqualified (with reason), etc.
            </p>

            <div className="mt-3 grid gap-2 md:grid-cols-2">
              <select
                value={exportQuizId}
                onChange={(event) => setExportQuizId(event.target.value)}
                className={selectClass}
              >
                <option value="all">All quizzes</option>
                {(quizzes || []).map((quiz) => (
                  <option key={quiz._id} value={quiz._id}>
                    {quiz.title}
                  </option>
                ))}
              </select>

              <select
                value={exportStatus}
                onChange={(event) => setExportStatus(event.target.value)}
                className={selectClass}
              >
                <option value="joined">All Joined</option>
                <option value="submitted">Submitted Only</option>
                <option value="disqualified">Disqualified + Reason</option>
                <option value="expired">Expired Only</option>
                <option value="in_progress">In Progress Only</option>
                <option value="locked">Locked Only</option>
              </select>

              <select
                value={exportSortBy}
                onChange={(event) => setExportSortBy(event.target.value)}
                className={selectClass}
              >
                <option value="latest">Sort: Latest</option>
                <option value="oldest">Sort: Oldest</option>
                <option value="score_desc">Sort: Score High → Low</option>
                <option value="score_asc">Sort: Score Low → High</option>
                <option value="rank">Sort: Rank</option>
              </select>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <a href={filteredExportHref} className={btnOutline}>
                <FiDownload className="h-3.5 w-3.5" />
                Download Selected CSV
              </a>
              <a href={rankedExportHref} className={btnOutline}>
                <FiDownload className="h-3.5 w-3.5" />
                Download Ranked CSV
              </a>
            </div>
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-amber-300">Re-submit Requests</p>
              <select
                value={requestStatusFilter}
                onChange={(event) => setRequestStatusFilter(event.target.value)}
                className={selectClass}
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="all">All</option>
              </select>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Review user requests from technical issues/warnings and decide whether to allow fresh re-attempt.
            </p>

            <div className="mt-3 space-y-3 max-h-64 overflow-auto pr-1">
              {!filteredRequests.length ? (
                <div className="rounded-xl border border-slate-700/40 bg-slate-900/30 p-3 text-sm text-slate-400">
                  No requests found for this filter.
                </div>
              ) : null}

              {filteredRequests.map((entry) => {
                const attempt = entry.attemptId || {};
                const noteValue = reviewNotes[entry._id] || "";
                const isPending = entry.status === "pending";

                return (
                  <div key={entry._id} className="rounded-xl border border-slate-700/40 bg-slate-900/30 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-white">{entry.quizId?.title || "Quiz"}</p>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${
                        entry.status === "approved"
                          ? "bg-emerald-500/10 text-emerald-300"
                          : entry.status === "rejected"
                            ? "bg-rose-500/10 text-rose-300"
                            : "bg-amber-500/10 text-amber-300"
                      }`}>
                        {entry.status}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-slate-400">
                      User: {entry.userId?.name || entry.userId?.email || "Unknown"} • Attempt status: {attempt.status || "-"}
                    </p>
                    {attempt.disqualifyReason ? (
                      <p className="mt-1 text-xs text-rose-300">Disqualify reason: {attempt.disqualifyReason}</p>
                    ) : null}
                    <p className="mt-2 text-sm text-slate-200">{entry.reason}</p>

                    {isPending ? (
                      <div className="mt-3 space-y-2">
                        <input
                          value={noteValue}
                          onChange={(event) =>
                            setReviewNotes((current) => ({
                              ...current,
                              [entry._id]: event.target.value,
                            }))
                          }
                          className={`${inputClass} w-full`}
                          placeholder="Optional note for approval, required for rejection"
                        />
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleReview(entry._id, "approved")}
                            disabled={workingRequestId === entry._id}
                            className={btnSuccess}
                          >
                            <FiCheckSquare className="h-3.5 w-3.5" /> Approve (Reset Attempt)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReview(entry._id, "rejected")}
                            disabled={workingRequestId === entry._id}
                            className={btnDanger}
                          >
                            <FiRefreshCw className="h-3.5 w-3.5" /> Reject
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-slate-500">
                        Reviewed by: {entry.reviewedBy?.name || entry.reviewedBy?.email || "-"}
                        {entry.reviewNote ? ` • Note: ${entry.reviewNote}` : ""}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by user email, name, or quiz title..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full rounded-xl border border-slate-600/50 bg-slate-900/50 py-2.5 pl-11 pr-4 text-sm text-white placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none"
            />
          </div>
          <div className="relative shrink-0">
            <FiFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 z-10" />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full sm:w-56 rounded-xl border border-slate-600/50 bg-slate-900/50 py-2.5 pl-11 pr-4 text-sm text-white focus:border-cyan-500/50 focus:outline-none appearance-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="locked">Action Needed (Locked)</option>
              <option value="disqualified">Disqualified</option>
              <option value="submitted">Submitted</option>
              <option value="in_progress">In Progress</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
              <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-700/30">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 bg-slate-900/50">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">User</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Quiz</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Status</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Score</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Warnings</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Reason</th>
                <th className="px-4 py-3 text-xs text-right font-semibold uppercase tracking-wider text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!filteredResults.length ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-500">
                    No results found matching your filters.
                  </td>
                </tr>
              ) : null}

              {filteredResults.map((row) => (
                <tr key={row._id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-white max-w-[200px] truncate" title={row.userId?.email}>
                    {row.userId?.name || row.userId?.email || "Unknown"}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400 max-w-[200px] truncate" title={row.quizId?.title}>
                    {row.quizId?.title || "Unknown"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                        row.status === "submitted"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : row.status === "in_progress"
                            ? "bg-amber-500/10 text-amber-400"
                            : row.status === "disqualified"
                              ? "bg-rose-500/10 text-rose-400"
                              : "bg-slate-500/10 text-slate-400"
                      }`}
                    >
                      {row.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-cyan-300">{row.totalScore ?? 0}</td>
                  <td className="px-4 py-3 text-sm text-amber-300">{row.warnings ?? 0}</td>
                  <td className="px-4 py-3 text-xs text-rose-300 max-w-[220px] truncate" title={row.disqualifyReason || ""}>
                    {row.disqualifyReason || "-"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {(row.status === "disqualified" || row.status === "in_progress" || row.isLocked) && (
                        <button
                          type="button"
                          title="Unlock/Resume Attempt"
                          onClick={() => onUnlockAttempt(row._id)}
                          className="inline-flex items-center rounded-lg bg-emerald-500/10 p-2 text-emerald-400 transition-colors hover:bg-emerald-500/20"
                        >
                          <FiPlayCircle className="h-4 w-4" />
                        </button>
                      )}

                      <button
                        type="button"
                        title="Delete Attempt (Allow Re-Attempt)"
                        onClick={() => {
                          if (
                            window.confirm(
                              "Delete this attempt and allow fresh re-attempt?"
                            )
                          ) {
                            onResetAttempt(row._id);
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
