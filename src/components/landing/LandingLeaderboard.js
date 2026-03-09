"use client";

import Link from "next/link";
import { FiTrendingUp, FiArrowRight } from "react-icons/fi";

export default function LandingLeaderboard({ topAttempts }) {
    return (
        <section className="relative py-20 md:py-24">
            <div className="landing-orb landing-orb-cyan w-62.5 h-62.5 top-10 right-10" />

            <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="landing-glass-strong rounded-3xl p-8 md:p-10 landing-fade-up landing-pulse-glow">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                        <div className="flex items-center gap-3">
                            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-500/10">
                                <FiTrendingUp className="w-5 h-5 text-cyan-400" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-extrabold text-white">
                                    Top Performers
                                </h2>
                                <p className="text-sm text-slate-400">
                                    Students leading the Aarambh Quiz leaderboard
                                </p>
                            </div>
                        </div>
                        <Link
                            href="/leaderboard"
                            className="landing-btn-secondary inline-flex items-center gap-2 text-sm py-2.5! px-5!"
                        >
                            Full Leaderboard
                            <FiArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {!topAttempts || topAttempts.length === 0 ? (
                        <div className="rounded-2xl border border-white/5 bg-white/3 p-8 text-center">
                            <FiTrendingUp className="mx-auto w-8 h-8 text-slate-500 mb-3" />
                            <p className="text-slate-400">
                                No quiz attempts yet. Be the first to appear on the leaderboard.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                                            Rank
                                        </th>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                                            Student
                                        </th>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                                            Quiz
                                        </th>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400 text-right">
                                            Correct Answers
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topAttempts.map((item, index) => (
                                        <tr
                                            key={String(item._id)}
                                            className="border-b border-white/5 hover:bg-white/3 transition-colors landing-fade-up"
                                            style={{ animationDelay: `${index * 80}ms` }}
                                        >
                                            <td className="px-4 py-4">
                                                {index === 0 ? (
                                                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-linear-to-br from-amber-400 to-orange-500 text-sm font-bold text-white">
                                                        1
                                                    </span>
                                                ) : index === 1 ? (
                                                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-linear-to-br from-slate-300 to-slate-400 text-sm font-bold text-white">
                                                        2
                                                    </span>
                                                ) : index === 2 ? (
                                                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-linear-to-br from-amber-600 to-amber-700 text-sm font-bold text-white">
                                                        3
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 text-sm font-semibold text-slate-400">
                                                        {index + 1}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-sm font-medium text-white">
                                                {item.userId?.fullName ||
                                                    item.userId?.name ||
                                                    item.userId?.email ||
                                                    "Student"}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-slate-400">
                                                {item.quizId?.title || "Quiz"}
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <span className="inline-flex items-center rounded-full bg-cyan-500/10 px-3 py-1 text-sm font-bold text-cyan-400">
                                                    {item.correctAnswers ?? 0}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
