import type {
  AddCandidatePayload,
  Candidate,
  SearchParams,
} from "./types";

// Base URL of the backend API. Configurable via NEXT_PUBLIC_API_URL so the
// same build can point at local / staging / prod backends.
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:4000";

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || "Request failed.");
  }
  return data as T;
}

// POST /api/candidates — fetch candidate leads for a search.
export function fetchCandidates(
  params: SearchParams
): Promise<{ candidates: Candidate[] }> {
  return postJson("/api/candidates", params);
}

// POST /api/sheets/add-candidate — save an approved/maybe candidate.
export function addCandidateToSheet(
  payload: Pick<AddCandidatePayload, "candidate" | "status">
): Promise<{ ok: boolean; mocked: boolean; message: string }> {
  return postJson("/api/sheets/add-candidate", payload);
}
