"use client";

import type { Candidate } from "@/lib/types";

interface CandidateCardProps {
  candidate: Candidate;
  index: number; // 0-based
  total: number;
  saving: boolean;
  onDecision: (decision: "approved" | "rejected" | "maybe") => void;
}

function scoreColor(score: number): string {
  if (score >= 85) return "bg-emerald-100 text-emerald-700";
  if (score >= 70) return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-600";
}

export default function CandidateCard({
  candidate,
  index,
  total,
  saving,
  onDecision,
}: CandidateCardProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Progress */}
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-3">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Candidate {index + 1} of {total}
        </span>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${scoreColor(
            candidate.fitScore
          )}`}
        >
          Fit score {candidate.fitScore}
        </span>
      </div>

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              {candidate.name}
            </h2>
            <p className="text-sm text-slate-600">{candidate.title}</p>
            <p className="text-sm text-slate-500">
              {candidate.company} · {candidate.location}
            </p>
          </div>
        </div>

        {/* Details grid */}
        <dl className="mt-5 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
          <Detail label="Practice area" value={candidate.practiceArea} />
          <Detail
            label="Languages"
            value={
              candidate.languages.length
                ? candidate.languages.join(", ")
                : "—"
            }
          />
          <Detail
            label="Email"
            value={
              candidate.email ? (
                <a
                  href={`mailto:${candidate.email}`}
                  className="text-brand-600 hover:text-brand-700"
                >
                  {candidate.email}
                </a>
              ) : (
                "—"
              )
            }
          />
          <Detail label="Phone" value={candidate.phone || "—"} />
          <Detail label="Source" value={candidate.source} />
          <Detail
            label="Profile"
            value={
              candidate.linkedinUrl ? (
                <a
                  href={candidate.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-600 hover:text-brand-700"
                >
                  LinkedIn ↗
                </a>
              ) : (
                "—"
              )
            }
          />
        </dl>

        {/* AI summary */}
        <div className="mt-5 rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            AI summary
          </p>
          <p className="mt-1 text-sm leading-relaxed text-slate-700">
            {candidate.summary}
          </p>
        </div>

        {/* Why they match */}
        <div className="mt-3 rounded-xl border border-brand-100 bg-brand-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
            Why they match
          </p>
          <p className="mt-1 text-sm leading-relaxed text-slate-700">
            {candidate.whyMatch}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:flex-row sm:items-center">
        <div className="flex flex-1 gap-2">
          <button
            onClick={() => onDecision("approved")}
            disabled={saving}
            className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Yes"}
          </button>
          <button
            onClick={() => onDecision("maybe")}
            disabled={saving}
            className="flex-1 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-50"
          >
            Maybe
          </button>
          <button
            onClick={() => onDecision("rejected")}
            disabled={saving}
            className="flex-1 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-300 transition hover:bg-slate-100 disabled:opacity-50"
          >
            No
          </button>
        </div>
        <a
          href={candidate.linkedinUrl || candidate.profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg px-4 py-2.5 text-center text-sm font-semibold text-brand-600 ring-1 ring-inset ring-brand-200 transition hover:bg-brand-50"
        >
          Open Profile
        </a>
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-slate-700">{value}</dd>
    </div>
  );
}
