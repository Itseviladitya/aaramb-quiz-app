import { useState, useMemo } from "react";
import { FiUsers, FiUserX, FiSlash, FiTrash2, FiSearch } from "react-icons/fi";

const selectClass = "rounded-xl border border-slate-600/50 bg-slate-700/50 px-4 py-2.5 text-sm text-white transition-colors focus:border-cyan-500/50 focus:bg-slate-700";
const btnOutline = "inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-600/50 bg-slate-700/30 px-3.5 py-2 text-sm font-medium text-slate-300 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white";
const btnDanger = "inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-950/30 px-3.5 py-2 text-sm font-medium text-rose-400 transition-all hover:border-rose-500/50 hover:bg-rose-950/50";

export default function AdminUsersTab({
    users,
    quizzes,
    canDeleteUser,
    disqualifyQuizIdByUser,
    setDisqualifyQuizIdByUser,
    onBan,
    onDisqualify,
    onDeleteUser
}) {
    const [searchQuery, setSearchQuery] = useState("");
    const [filter, setFilter] = useState("all"); // 'all', 'active', 'banned'

    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const matchesSearch =
                (user.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (user.email || "").toLowerCase().includes(searchQuery.toLowerCase());

            const matchesFilter =
                filter === "all" ? true :
                    filter === "active" ? !user.isBanned :
                        filter === "banned" ? user.isBanned : true;

            return matchesSearch && matchesFilter;
        });
    }, [users, searchQuery, filter]);

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-6 shadow-sm">
                <h2 className="mb-5 text-lg font-bold text-white flex items-center gap-2">
                    <FiUsers className="h-5 w-5 text-cyan-400" />
                    User Moderation
                </h2>

                {!canDeleteUser && (
                    <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-300">
                        Manager role can moderate users but cannot delete users.
                    </div>
                )}

                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-xl border border-slate-600/50 bg-slate-900/50 py-2.5 pl-11 pr-4 text-sm text-white placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none"
                        />
                    </div>
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="rounded-xl border border-slate-600/50 bg-slate-900/50 px-4 py-2.5 text-sm text-white focus:border-cyan-500/50 focus:outline-none sm:w-48"
                    >
                        <option value="all">All Users</option>
                        <option value="active">Active Only</option>
                        <option value="banned">Banned Only</option>
                    </select>
                </div>

                {!filteredUsers.length ? (
                    <div className="rounded-xl border border-slate-700/30 bg-slate-900/40 p-12 text-center">
                        <p className="text-sm text-slate-400">No users found matching your filters.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredUsers.map((user) => (
                            <div
                                key={user._id}
                                className="flex flex-col gap-4 rounded-xl border border-slate-700/30 bg-slate-900/30 p-4 sm:flex-row sm:items-center sm:justify-between hover:bg-slate-800/50 transition-colors"
                            >
                                <div className="min-w-0">
                                    <p className="font-semibold text-white truncate flex items-center gap-2">
                                        {user.name || user.email}
                                        {user.isBanned && (
                                            <span className="inline-flex items-center rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-rose-400">
                                                Banned
                                            </span>
                                        )}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1">{user.email}</p>
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
                                        <option value="">Select quiz to disqualify</option>
                                        {quizzes.map((quiz) => (
                                            <option key={quiz._id} value={quiz._id}>
                                                {quiz.title}
                                            </option>
                                        ))}
                                    </select>

                                    <button type="button" onClick={() => onDisqualify(user._id)} className={btnOutline}>
                                        <FiSlash className="h-3.5 w-3.5 text-amber-400" /> Disqualify
                                    </button>

                                    {canDeleteUser && (
                                        <button type="button" onClick={() => onDeleteUser(user._id)} className={btnDanger}>
                                            <FiTrash2 className="h-3.5 w-3.5" /> Delete
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
