import { useState } from "react";
import { FiPlusCircle, FiEdit2, FiXCircle, FiFileText, FiClock, FiHash, FiAlertTriangle, FiList, FiPauseCircle, FiPlayCircle, FiTrash2, FiSettings } from "react-icons/fi";

const inputClass = "rounded-xl border border-slate-600/50 bg-slate-700/50 px-4 py-2.5 text-sm text-white placeholder-slate-500 transition-colors focus:border-cyan-500/50 focus:bg-slate-700";
const selectClass = "rounded-xl border border-slate-600/50 bg-slate-700/50 px-4 py-2.5 text-sm text-white transition-colors focus:border-cyan-500/50 focus:bg-slate-700";
const btnOutline = "inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-600/50 bg-slate-700/30 px-3.5 py-2 text-sm font-medium text-slate-300 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white";
const btnDanger = "inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-950/30 px-3.5 py-2 text-sm font-medium text-rose-400 transition-all hover:border-rose-500/50 hover:bg-rose-950/50";

export default function AdminQuizzesTab({
    quizzes,
    form,
    setForm,
    questionJson,
    setQuestionJson,
    onCreateQuiz,
    onEditQuiz,
    onCancelEdit,
    editingQuizId,
    onSetStatus,
    onDeleteQuiz
}) {
    const [showForm, setShowForm] = useState(false);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FiFileText className="h-6 w-6 text-cyan-400" />
                    Quiz Library
                </h2>
                {!showForm && !editingQuizId && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all hover:shadow-cyan-500/30"
                    >
                        <FiPlusCircle className="h-4 w-4" />
                        Create Quiz
                    </button>
                )}
            </div>

            {(showForm || editingQuizId) && (
                <section className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-6 md:p-8 shadow-sm">
                    <h2 className="mb-6 text-lg font-bold text-white flex items-center gap-2">
                        {editingQuizId ? (
                            <><FiEdit2 className="h-5 w-5 text-amber-400" /> Edit Quiz</>
                        ) : (
                            <><FiPlusCircle className="h-5 w-5 text-cyan-400" /> Create New Quiz</>
                        )}
                    </h2>

                    <form onSubmit={(e) => {
                        onCreateQuiz(e);
                        setShowForm(false);
                    }} className="grid gap-5 md:grid-cols-2">
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
                            <button type="button" onClick={() => {
                                onCancelEdit();
                                setShowForm(false);
                            }} className={btnOutline}>
                                <FiXCircle className="h-4 w-4" />
                                Cancel
                            </button>
                        </div>
                    </form>
                </section>
            )}

            {/* ─── Quiz Controls ─── */}
            <section className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-6 md:p-8 shadow-sm">
                <h2 className="mb-5 text-lg font-bold text-white flex items-center gap-2">
                    <FiSettings className="h-5 w-5 text-cyan-400" />
                    Active Quizzes
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
                                className="flex flex-col gap-4 rounded-xl border border-slate-700/30 bg-slate-900/30 p-4 sm:flex-row sm:items-center sm:justify-between hover:bg-slate-800/50 transition-colors"
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
                                    <button type="button" onClick={() => {
                                        onEditQuiz(quiz._id);
                                        setShowForm(true);
                                    }} className={btnOutline}>
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
        </div>
    );
}
