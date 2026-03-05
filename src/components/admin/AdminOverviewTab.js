import { FiUsers, FiActivity, FiCheckSquare } from "react-icons/fi";

export default function AdminOverviewTab({ stats }) {
    return (
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
    );
}
