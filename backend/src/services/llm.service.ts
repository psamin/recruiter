import Anthropic from "@anthropic-ai/sdk";
import type { Candidate, SearchParams } from "../types";
import { generateCandidates } from "./candidates.service";

// ---------------------------------------------------------------------------
// LLM SOURCING + SCORING AGENT
//
// Uses Claude with Anthropic's SERVER-SIDE web search tool to source candidate
// leads from the public web, then score each against the recruiting prompt.
// This is the compliant analog of a "browser-searching" agent: Anthropic runs
// the search and returns results with citations.
//
// (To also let the agent open and read individual pages, add the web_fetch
// tool — it needs the matching beta header on this SDK version.)
//
// COMPLIANCE: web_fetch respects robots.txt / site terms. This does NOT scrape
// LinkedIn or drive a logged-in browser — LinkedIn is treated as a link only.
// Everything returned is a *lead* to be human-verified in the review board.
//
// SAFE LOCAL FALLBACK: if ANTHROPIC_API_KEY is not set, this returns the mock
// dataset instead of crashing — same pattern as googleSheets.service.ts.
// ---------------------------------------------------------------------------

const MODEL = "claude-opus-4-8";

export interface SourcingResult {
  candidates: Candidate[];
  sourced: "llm" | "mock";
  note?: string;
}

// The shape we ask Claude to emit per candidate. We add id/status ourselves.
interface LlmCandidate {
  name?: string;
  title?: string;
  company?: string;
  location?: string;
  practiceArea?: string;
  languages?: string[];
  linkedinUrl?: string;
  profileUrl?: string;
  email?: string;
  phone?: string;
  source?: string;
  fitScore?: number;
  summary?: string;
  whyMatch?: string;
}

function buildPrompt(params: SearchParams): string {
  const filters = [
    params.location && `Location: ${params.location}`,
    params.role && `Role/title: ${params.role}`,
    params.industry && `Industry/practice area: ${params.industry}`,
    params.language && `Language preference: ${params.language}`,
  ]
    .filter(Boolean)
    .join("\n");

  return [
    `You are a recruiting sourcer for Wayco. Find up to ${params.maxCandidates} real candidate leads from the PUBLIC web that match this brief.`,
    ``,
    `Recruiting prompt: ${params.prompt}`,
    filters && `\nStructured filters:\n${filters}`,
    ``,
    `Rules:`,
    `- Use the web_search tool to find real people from public sources (firm sites, bar directories, public bios, news).`,
    `- Do NOT fabricate people or contact details. Only include a field if you found it on a public source; otherwise leave it empty.`,
    `- Do NOT attempt to access LinkedIn pages — only include a LinkedIn URL if it appears as a public search result link.`,
    `- For each candidate, set "source" to the public URL you found them on.`,
    `- Give each a fitScore (0-100) and a one-sentence "whyMatch" explaining the match to the prompt, plus a short "summary".`,
    ``,
    `Output: respond with ONLY a JSON array (no prose, no markdown fences) of objects with these keys:`,
    `name, title, company, location, practiceArea, languages (array of strings), linkedinUrl, profileUrl, email, phone, source, fitScore (number), summary, whyMatch.`,
  ]
    .filter(Boolean)
    .join("\n");
}

function extractJsonArray(text: string): LlmCandidate[] {
  // Strip markdown fences if the model added them despite instructions.
  const cleaned = text.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("No JSON array found in model response.");
  }
  const parsed = JSON.parse(cleaned.slice(start, end + 1));
  if (!Array.isArray(parsed)) throw new Error("Parsed value is not an array.");
  return parsed as LlmCandidate[];
}

function toCandidate(raw: LlmCandidate, index: number): Candidate {
  const score =
    typeof raw.fitScore === "number"
      ? Math.max(0, Math.min(100, Math.round(raw.fitScore)))
      : 50;
  return {
    id: `llm-${index + 1}`,
    name: raw.name?.trim() || "Unknown",
    title: raw.title?.trim() || "",
    company: raw.company?.trim() || "",
    location: raw.location?.trim() || "",
    practiceArea: raw.practiceArea?.trim() || "",
    languages: Array.isArray(raw.languages) ? raw.languages : [],
    linkedinUrl: raw.linkedinUrl?.trim() || "",
    profileUrl: raw.profileUrl?.trim() || raw.source?.trim() || "",
    email: raw.email?.trim() || "",
    phone: raw.phone?.trim() || "",
    source: raw.source?.trim() || "Web search (Claude)",
    fitScore: score,
    summary: raw.summary?.trim() || "",
    whyMatch: raw.whyMatch?.trim() || "",
    status: "new",
  };
}

/**
 * Sources and scores candidates via Claude's web-search tools.
 *
 * Falls back to the mock dataset when ANTHROPIC_API_KEY is missing or the model
 * call fails, so the review board always has something to show.
 */
export async function sourceCandidates(
  params: SearchParams
): Promise<SourcingResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn(
      "[llm] Missing ANTHROPIC_API_KEY — returning mock candidates. " +
        "Set it in backend/.env to enable live web sourcing via Claude."
    );
    return {
      candidates: generateCandidates(params),
      sourced: "mock",
      note: "No ANTHROPIC_API_KEY configured — showing mock candidates.",
    };
  }

  try {
    const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env

    // Server-side tools: Anthropic runs the search/fetch. We only need to
    // continue the turn when the server loop pauses (stop_reason: pause_turn).
    const messages: Anthropic.MessageParam[] = [
      { role: "user", content: buildPrompt(params) },
    ];

    let response = await client.messages.create({
      model: MODEL,
      max_tokens: 8000,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      messages,
    });

    // Resume the server-side tool loop if it paused (max ~5 continuations).
    for (let i = 0; i < 5 && response.stop_reason === "pause_turn"; i++) {
      messages.push({ role: "assistant", content: response.content });
      response = await client.messages.create({
        model: MODEL,
        max_tokens: 8000,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages,
      });
    }

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");

    const candidates = extractJsonArray(text)
      .slice(0, params.maxCandidates)
      .map(toCandidate);

    if (candidates.length === 0) {
      return {
        candidates: generateCandidates(params),
        sourced: "mock",
        note: "Web search returned no usable leads — showing mock candidates.",
      };
    }

    return { candidates, sourced: "llm" };
  } catch (err) {
    console.error("[llm] Sourcing failed, falling back to mock:", err);
    return {
      candidates: generateCandidates(params),
      sourced: "mock",
      note: "Live sourcing failed — showing mock candidates.",
    };
  }
}
