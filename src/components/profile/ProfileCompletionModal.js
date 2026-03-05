"use client";

import { useState } from "react";

const BRANCH_OPTIONS = [
  "computer science and engineering",
  "mechanical engineering",
  "civil engineering",
  "electrical engineering",
  "electronics and communication engineering",
];

export default function ProfileCompletionModal({ profile, onCompleted }) {
  const [form, setForm] = useState({
    fullName: profile.fullName || "",
    branch: profile.branch || "",
    yearOfStudy: profile.yearOfStudy || "",
    studentId: profile.studentId || "",
    phoneNumber: profile.phoneNumber || "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Unable to update profile");
      }
      onCompleted?.();
    } catch (err) {
      setError(err.message || "Unable to update profile");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <form onSubmit={onSubmit} className="w-full max-w-xl rounded-xl border border-zinc-200 bg-white p-6 shadow-xl">
        <h2 className="text-xl font-semibold text-zinc-900">Complete Student Profile</h2>
        <p className="mt-1 text-sm text-zinc-600">Fill this once to continue on Aarambh Quiz Platform.</p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm text-zinc-700">
            <span className="font-medium">Full Name (for certificate)</span>
            <input
              className="rounded-md border border-zinc-300 px-3 py-2"
              value={form.fullName}
              onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-zinc-700">
            <span className="font-medium">Email (GitHub)</span>
            <input className="rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2" value={profile.email} disabled />
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
            <span className="font-medium">Student ID (for certificate)</span>
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
            <input className="rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2" value="Fetched from GitHub" disabled />
          </label>
        </div>

        {error ? <p className="mt-3 rounded-md border border-rose-300 bg-rose-50 p-2 text-sm text-rose-700">{error}</p> : null}

        <button
          type="submit"
          disabled={submitting}
          className="mt-4 inline-flex cursor-pointer items-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
        >
          {submitting ? "Submitting..." : "Submit"}
        </button>
      </form>
    </div>
  );
}