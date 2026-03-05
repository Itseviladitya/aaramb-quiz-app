"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const BRANCH_OPTIONS = [
  "computer science and engineering",
  "mechanical engineering",
  "civil engineering",
  "electrical engineering",
  "electronics and communication engineering",
];

export default function ProfilePage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    image: "",
    branch: "",
    yearOfStudy: "",
    studentId: "",
    phoneNumber: "",
  });
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }

    if (status !== "authenticated") {
      return;
    }

    async function loadProfileData() {
      try {
        setLoading(true);
        setError("");

        const [profileResponse, historyResponse] = await Promise.all([fetch("/api/profile"), fetch("/api/profile/history")]);
        const profileData = await profileResponse.json();
        const historyData = await historyResponse.json();

        if (!profileResponse.ok) {
          throw new Error(profileData.message || "Unable to load profile");
        }
        if (!historyResponse.ok) {
          throw new Error(historyData.message || "Unable to load profile history");
        }

        const profile = profileData.profile || {};
        setForm({
          fullName: profile.fullName || "",
          email: profile.email || "",
          image: profile.image || "",
          branch: profile.branch || "",
          yearOfStudy: String(profile.yearOfStudy || ""),
          studentId: profile.studentId || "",
          phoneNumber: profile.phoneNumber || "",
        });
        setHistory(historyData.attempts || []);
      } catch (err) {
        setError(err.message || "Unable to load profile");
      } finally {
        setLoading(false);
      }
    }

    loadProfileData();
  }, [router, status]);

  const canSubmit = useMemo(() => {
    return Boolean(form.fullName && form.branch && form.yearOfStudy && form.studentId && form.phoneNumber);
  }, [form]);

  async function onSubmit(event) {
    event.preventDefault();
    if (!canSubmit) {
      setError("Please fill all required profile fields");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          branch: form.branch,
          yearOfStudy: Number(form.yearOfStudy),
          studentId: form.studentId,
          phoneNumber: form.phoneNumber,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update profile");
      }

      setSuccess("Profile updated successfully");
    } catch (err) {
      setError(err.message || "Unable to update profile");
    } finally {
      setSaving(false);
    }
  }

  if (loading || status === "loading") {
    return <p className="text-sm text-zinc-600">Loading profile...</p>;
  }

  return (
    <section className="space-y-6">
      <header className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-zinc-900">Student Profile</h1>
        <p className="mt-1 text-sm text-zinc-600">Manage your student details and review your quiz attempt history.</p>
      </header>

      <form onSubmit={onSubmit} className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm text-zinc-700">
            <span className="font-medium">Full Name</span>
            <input
              className="rounded-md border border-zinc-300 px-3 py-2"
              value={form.fullName}
              onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-zinc-700">
            <span className="font-medium">Email (GitHub)</span>
            <input className="rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2" value={form.email} disabled />
          </label>
          <label className="flex flex-col gap-1 text-sm text-zinc-700 md:col-span-2">
            <span className="font-medium">Branch</span>
            <select
              className="rounded-md border border-zinc-300 px-3 py-2"
              value={form.branch}
              onChange={(event) => setForm((current) => ({ ...current, branch: event.target.value }))}
              required
            >
              <option value="">Select branch</option>
              {BRANCH_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-zinc-700">
            <span className="font-medium">Year of Study</span>
            <input
              type="number"
              min={1}
              max={8}
              className="rounded-md border border-zinc-300 px-3 py-2"
              value={form.yearOfStudy}
              onChange={(event) => setForm((current) => ({ ...current, yearOfStudy: event.target.value }))}
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-zinc-700">
            <span className="font-medium">Student ID</span>
            <input
              className="rounded-md border border-zinc-300 px-3 py-2"
              value={form.studentId}
              onChange={(event) => setForm((current) => ({ ...current, studentId: event.target.value }))}
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-zinc-700">
            <span className="font-medium">Phone / WhatsApp</span>
            <input
              className="rounded-md border border-zinc-300 px-3 py-2"
              value={form.phoneNumber}
              onChange={(event) => setForm((current) => ({ ...current, phoneNumber: event.target.value }))}
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-zinc-700">
            <span className="font-medium">Profile Picture (GitHub)</span>
            <input className="rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2" value={form.image ? "Synced from GitHub" : "Not available"} disabled />
          </label>
        </div>

        {error ? <p className="mt-3 rounded-md border border-rose-300 bg-rose-50 p-2 text-sm text-rose-700">{error}</p> : null}
        {success ? <p className="mt-3 rounded-md border border-emerald-300 bg-emerald-50 p-2 text-sm text-emerald-700">{success}</p> : null}

        <button
          type="submit"
          disabled={saving || !canSubmit}
          className="mt-4 inline-flex items-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </form>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-zinc-900">Quiz Attempt History</h2>
        {!history.length ? (
          <p className="mt-3 rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
            You have not attempted any quiz yet.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-zinc-600">
                <tr>
                  <th className="px-3 py-2">Quiz</th>
                  <th className="px-3 py-2">Score</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {history.map((attempt) => (
                  <tr key={attempt._id} className="border-t border-zinc-100">
                    <td className="px-3 py-2">{attempt.quizId?.title || "Quiz"}</td>
                    <td className="px-3 py-2">{attempt.totalScore ?? 0}</td>
                    <td className="px-3 py-2 capitalize">{attempt.status}</td>
                    <td className="px-3 py-2">{new Date(attempt.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}
