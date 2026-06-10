// Shared backend types for the Wayco candidate review board.

export type CandidateStatus = "new" | "approved" | "rejected" | "maybe";

export interface Candidate {
  id: string;
  name: string;
  title: string;
  company: string;
  location: string;
  practiceArea: string;
  languages: string[];
  linkedinUrl: string;
  profileUrl: string;
  email: string;
  phone: string;
  source: string;
  fitScore: number; // 0-100
  summary: string;
  whyMatch: string;
  status: CandidateStatus;
}

// Shape of the search request from the frontend.
export interface SearchParams {
  prompt: string;
  location: string;
  role: string;
  industry: string;
  language: string;
  maxCandidates: number;
}

// Payload for POST /api/sheets/add-candidate.
export interface AddCandidatePayload {
  candidate: Candidate;
  status: Extract<CandidateStatus, "approved" | "maybe">;
  notes?: string;
  reviewer?: string;
}
