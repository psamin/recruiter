"use client";

import { useMemo, useState } from "react";
import SearchForm from "@/components/SearchForm";
import CandidateCard from "@/components/CandidateCard";
import { fetchCandidates, addCandidateToSheet } from "@/lib/api";
import type { Candidate, SearchParams } from "@/lib/types";

type Decision = "approved" | "rejected" | "maybe";

export default function Home() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Simple in-memory review state.
  const [approved, setApproved] = useState<Candidate[]>([]);
  const [rejected, setRejected] = useState<Candidate[]>([]);
  const [maybe, setMaybe] = useState<Candidate[]>([]);

  const started = candidates.length > 0;
  const finished = started && currentIndex >= candidates.length;
  const current = started ? candidates[currentIndex] : null;

  const reviewedCount = approved.length + rejected.length + maybe.length;

  async function handleSearch(params: SearchParams) {
    setLoading(true);
    setSearchError(null);
    try {
      const data = await fetchCandidates(params);
      setCandidates(data.candidates);
      setCurrentIndex(0);
      setApproved([]);
      setRejected([]);
      setMaybe([]);
    } catch (err) {
      setSearchError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  // Saves approved/maybe candidates to the connected Google Sheet (via backend).
  async function saveToSheet(candidate: Candidate, status: "approved" | "maybe") {
    try {
      const data = await addCandidateToSheet({ candidate, status });
      setToast(data.message || "Saved.");
    } catch {
      setToast("Could not reach the backend.");
    } finally {
      // Clear the toast after a moment.
      setTimeout(() => setToast(null), 3500);
    }
  }

  async function handleDecision(decision: Decision) {
    if (!current) return;

    if (decision === "approved") {
      setApproved((prev) => [...prev, current]);
      setSaving(true);
      await saveToSheet(current, "approved");
      setSaving(false);
    } else if (decision === "maybe") {
      setMaybe((prev) => [...prev, current]);
      setSaving(true);
      await saveToSheet(current, "maybe");
      setSaving(false);
    } else {
      setRejected((prev) => [...prev, current]);
    }

    setCurrentIndex((i) => i + 1);
  }

  function resetSearch() {
    setCandidates([]);
    setCurrentIndex(0);
    setApproved([]);
    setRejected([]);
    setMaybe([]);
    setSearchError(null);
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-10 sm:py-14">
      <Header counts={{ approved: approved.length, maybe: maybe.length, rejected: rejected.length }} />

      {!started && (
        <div className="mt-8">
          <p className="mb-6 text-sm text-slate-600">
            Describe who you're looking for. We'll surface candidate leads to
            review one at a time. Approved candidates are saved to the connected
            Google Sheet.
          </p>
          <SearchForm onSearch={handleSearch} loading={loading} />
          {searchError && (
            <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {searchError}
            </p>
          )}
        </div>
      )}

      {started && !finished && current && (
        <div className="mt-8">
          <ProgressBar current={reviewedCount} total={candidates.length} />
          <div className="mt-4">
            <CandidateCard
              candidate={current}
              index={currentIndex}
              total={candidates.length}
              saving={saving}
              onDecision={handleDecision}
            />
          </div>
        </div>
      )}

      {finished && (
        <CompletedState
          approved={approved}
          maybe={maybe}
          rejectedCount={rejected.length}
          onReset={resetSearch}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </main>
  );
}

function Header({
  counts,
}: {
  counts: { approved: number; maybe: number; rejected: number };
}) {
  return (
    <header className="flex items-center justify-between">
      <div>
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
            W
          </span>
          <h1 className="text-lg font-semibold text-slate-900">
            Wayco Sourcing
          </h1>
        </div>
        <p className="mt-0.5 text-xs text-slate-500">
          AI candidate review board
        </p>
      </div>
      <div className="flex gap-2 text-xs">
        <Badge label="Yes" value={counts.approved} className="bg-emerald-100 text-emerald-700" />
        <Badge label="Maybe" value={counts.maybe} className="bg-amber-100 text-amber-700" />
        <Badge label="No" value={counts.rejected} className="bg-slate-100 text-slate-600" />
      </div>
    </header>
  );
}

function Badge({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className: string;
}) {
  return (
    <span className={`rounded-full px-2.5 py-1 font-semibold ${className}`}>
      {label} {value}
    </span>
  );
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-500">
        <span>
          {current} of {total} reviewed
        </span>
        <span>{pct}%</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-brand-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function CompletedState({
  approved,
  maybe,
  rejectedCount,
  onReset,
}: {
  approved: Candidate[];
  maybe: Candidate[];
  rejectedCount: number;
  onReset: () => void;
}) {
  const summary = useMemo(
    () => [
      { label: "Approved", items: approved, tone: "text-emerald-700" },
      { label: "Maybe", items: maybe, tone: "text-amber-700" },
    ],
    [approved, maybe]
  );

  return (
    <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl">
        ✓
      </div>
      <h2 className="mt-4 text-xl font-semibold text-slate-900">
        Review complete
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        {approved.length} approved · {maybe.length} maybe · {rejectedCount} passed.
        Approved &amp; maybe candidates were sent to the Google Sheet.
      </p>

      <div className="mt-6 space-y-5 text-left">
        {summary.map(
          (group) =>
            group.items.length > 0 && (
              <div key={group.label}>
                <h3 className={`text-sm font-semibold ${group.tone}`}>
                  {group.label} ({group.items.length})
                </h3>
                <ul className="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-200">
                  {group.items.map((c) => (
                    <li
                      key={c.id}
                      className="flex items-center justify-between px-4 py-2.5 text-sm"
                    >
                      <span className="text-slate-700">
                        {c.name} — {c.title}
                      </span>
                      <span className="text-xs text-slate-400">
                        Fit {c.fitScore}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )
        )}
      </div>

      <button
        onClick={onReset}
        className="mt-7 inline-flex h-10 items-center rounded-lg bg-brand-600 px-6 text-sm font-semibold text-white transition hover:bg-brand-700"
      >
        New search
      </button>
    </div>
  );
}
