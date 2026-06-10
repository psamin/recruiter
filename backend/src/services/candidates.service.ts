import type { Candidate, SearchParams } from "../types";
import { MOCK_CANDIDATES } from "../data/mockCandidates";

/**
 * Returns mock candidates for a given search.
 *
 * For the MVP this does light, deterministic relevance scoring against the
 * search params so the demo feels responsive: matching candidates float to the
 * top and get a small fit-score nudge. There is no real search backend yet.
 *
 * REPLACE-ME: swap the body of this function for a call to a compliant
 * candidate-search / sourcing provider. Keep the return type the same and the
 * rest of the app keeps working unchanged.
 */
export function generateCandidates(params: SearchParams): Candidate[] {
  const haystackTerms = [
    params.prompt,
    params.location,
    params.role,
    params.industry,
    params.language,
  ]
    .join(" ")
    .toLowerCase();

  const scored = MOCK_CANDIDATES.map((candidate) => {
    const candidateText = [
      candidate.title,
      candidate.location,
      candidate.practiceArea,
      candidate.summary,
      candidate.whyMatch,
      candidate.languages.join(" "),
    ]
      .join(" ")
      .toLowerCase();

    // Count how many meaningful query words appear in the candidate.
    const queryWords = haystackTerms
      .split(/[^a-z]+/)
      .filter((w) => w.length > 3);

    const overlap = queryWords.reduce(
      (count, word) => (candidateText.includes(word) ? count + 1 : count),
      0
    );

    // Nudge the displayed fit score by relevance, capped at 99.
    const adjustedScore = Math.min(99, candidate.fitScore + overlap * 2);

    return { candidate: { ...candidate, fitScore: adjustedScore }, overlap };
  });

  // Most relevant first, then by base fit score.
  scored.sort((a, b) => {
    if (b.overlap !== a.overlap) return b.overlap - a.overlap;
    return b.candidate.fitScore - a.candidate.fitScore;
  });

  const max = Number.isFinite(params.maxCandidates)
    ? Math.max(1, Math.min(params.maxCandidates, MOCK_CANDIDATES.length))
    : MOCK_CANDIDATES.length;

  return scored.slice(0, max).map((s) => s.candidate);
}
