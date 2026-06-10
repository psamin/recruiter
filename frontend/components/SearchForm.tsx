"use client";

import { useState } from "react";
import type { SearchParams } from "@/lib/types";

interface SearchFormProps {
  onSearch: (params: SearchParams) => void;
  loading: boolean;
}

const EXAMPLE_PROMPT =
  "Find early-career attorneys in NY/NJ with personal injury or med-legal experience who may speak Spanish.";

export default function SearchForm({ onSearch, loading }: SearchFormProps) {
  const [prompt, setPrompt] = useState("");
  const [location, setLocation] = useState("");
  const [role, setRole] = useState("");
  const [industry, setIndustry] = useState("");
  const [language, setLanguage] = useState("");
  const [maxCandidates, setMaxCandidates] = useState(20);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim() || loading) return;
    onSearch({ prompt, location, role, industry, language, maxCandidates });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <div className="space-y-5">
        <div>
          <label
            htmlFor="prompt"
            className="block text-sm font-medium text-slate-700"
          >
            Recruiting prompt
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder={EXAMPLE_PROMPT}
            className="mt-1.5 w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm outline-none placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
          <button
            type="button"
            onClick={() => setPrompt(EXAMPLE_PROMPT)}
            className="mt-1.5 text-xs font-medium text-brand-600 hover:text-brand-700"
          >
            Use example prompt
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            id="location"
            label="Location preference"
            value={location}
            onChange={setLocation}
            placeholder="e.g. NY / NJ"
          />
          <Field
            id="role"
            label="Role / title"
            value={role}
            onChange={setRole}
            placeholder="e.g. Associate Attorney"
          />
          <Field
            id="industry"
            label="Industry / practice area"
            value={industry}
            onChange={setIndustry}
            placeholder="e.g. Personal Injury, Med-legal"
          />
          <Field
            id="language"
            label="Language preference"
            value={language}
            onChange={setLanguage}
            placeholder="e.g. Spanish"
          />
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="w-full sm:w-40">
            <label
              htmlFor="maxCandidates"
              className="block text-sm font-medium text-slate-700"
            >
              Max candidates
            </label>
            <input
              id="maxCandidates"
              type="number"
              min={1}
              max={50}
              value={maxCandidates}
              onChange={(e) =>
                setMaxCandidates(Number(e.target.value) || 1)
              }
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-brand-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Finding candidates…" : "Find Candidates"}
          </button>
        </div>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm outline-none placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      />
    </div>
  );
}
