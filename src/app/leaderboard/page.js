"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { FiAward, FiBarChart2, FiTarget, FiTrendingUp, FiUsers } from "react-icons/fi";
import { fetchLeaderboard } from "@/services/leaderboardService";

function rankStyle(rank) {
  if (rank === 1) {
    return "bg-amber-500/15 text-amber-300 border-amber-400/30";
  }
  if (rank === 2) {
    return "bg-slate-500/20 text-slate-200 border-slate-300/30";
  }
  if (rank === 3) {
    return "bg-orange-500/15 text-orange-300 border-orange-400/30";
  }
  return "bg-slate-800 text-slate-300 border-slate-700";
}

export default function LeaderboardPage() {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/login?callbackUrl=${encodeURIComponent(pathname || "/leaderboard")}`);
      return;
    }

    if (status !== "authenticated") {
      return;
    }

    async function loadLeaderboard() {
      try {
        setIsLoading(true);
        setError("");
        const data = await fetchLeaderboard();
        setRows(data.rows || []);
      } catch (err) {
        setError(err.message || "Unable to load leaderboard");
      } finally {
        setIsLoading(false);
      }
    }

    loadLeaderboard();
  }, [status, router, pathname]);

  const topThree = useMemo(() => rows.slice(0, 3), [rows]);

  const stats = useMemo(() => {
    const participantEmails = new Set(rows.map((row) => row.userId?.email).filter(Boolean));
    const quizTitles = new Set(rows.map((row) => row.quizId?.title).filter(Boolean));
    const highestCorrectAnswers = rows.length ? Math.max(...rows.map((row) => row.correctAnswers || 0)) : 0;

    return {
      participants: participantEmails.size,
      quizzes: quizTitles.size,
      highestCorrectAnswers,
      entries: rows.length,
    };
  }, [rows]);

  if (status === "loading") {
    return <p className="text-sm text-slate-400">Loading leaderboard...</p>;
  }

  return (
    <section className="space-y-6 text-slate-100">
      <header className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-6 shadow-xl">
        <h1 className="flex items-center gap-2 text-2xl font-extrabold md:text-3xl">
          <FiAward className="text-cyan-400" />
          Leaderboard
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Track top performers across quizzes and monitor competition standings in real time.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-4">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <FiUsers /> Participants
          </p>
          <p className="mt-2 text-2xl font-bold">{stats.participants}</p>
        </div>
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-4">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <FiBarChart2 /> Quizzes
          </p>
          <p className="mt-2 text-2xl font-bold">{stats.quizzes}</p>
        </div>
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-4">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <FiTarget /> Highest Correct Answers
          </p>
          <p className="mt-2 text-2xl font-bold">{stats.highestCorrectAnswers}</p>
        </div>
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-4">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <FiTrendingUp /> Ranked Entries
          </p>
          <p className="mt-2 text-2xl font-bold">{stats.entries}</p>
        </div>
      </div>

      {error ? <p className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-4 text-sm text-rose-300">{error}</p> : null}

      {!isLoading && !rows.length ? (
        <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-8 text-center">
          <p className="text-sm text-slate-400">No leaderboard entries yet.</p>
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-8 text-sm text-slate-400">Loading rankings...</div>
      ) : null}

      {!isLoading && rows.length ? (
        <>
          <section className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-5 shadow-lg">
            <h2 className="text-lg font-bold text-white">Top Performers</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {topThree.map((row, index) => {
                const rank = index + 1;
                return (
                  <div key={row._id} className="rounded-xl border border-slate-700/50 bg-slate-800/70 p-4">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${rankStyle(rank)}`}>#{rank}</span>
                    <p className="mt-3 truncate text-sm font-semibold text-slate-100">{row.userId?.name || row.userId?.email || "Student"}</p>
                    <p className="mt-1 truncate text-xs text-slate-400">{row.quizId?.title || "Quiz"}</p>
                    <p className="mt-3 text-xl font-extrabold text-cyan-300">{row.correctAnswers ?? 0}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/80 shadow-lg">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-800/80 text-slate-400">
                <tr>
                  <th className="px-4 py-3">Rank</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Quiz</th>
                  <th className="px-4 py-3">Correct Answers</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => {
                  const rank = index + 1;
                  return (
                    <tr key={row._id} className="border-t border-slate-800/80 hover:bg-white/3">
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${rankStyle(rank)}`}>#{rank}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-200">{row.userId?.name || row.userId?.email || "Student"}</td>
                      <td className="px-4 py-3 text-slate-400">{row.quizId?.title || "Quiz"}</td>
                      <td className="px-4 py-3 font-semibold text-cyan-300">{row.correctAnswers ?? 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        </>
      ) : null}
    </section>
  );
}
