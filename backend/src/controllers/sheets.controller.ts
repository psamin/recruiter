import type { Request, Response } from "express";
import { addCandidateToSheet } from "../services/googleSheets.service";
import type { AddCandidatePayload } from "../types";

// POST /api/sheets/add-candidate
// Appends an approved/maybe candidate to the connected Google Sheet.
// Safe to call locally: returns a mock success when credentials are absent.
export async function addCandidate(req: Request, res: Response) {
  const body = (req.body ?? {}) as Partial<AddCandidatePayload>;

  if (!body.candidate || !body.candidate.id) {
    return res.status(400).json({ error: "A candidate is required." });
  }

  const status = body.status === "maybe" ? "maybe" : "approved";

  const result = await addCandidateToSheet({
    candidate: body.candidate,
    status,
    notes: body.notes,
    reviewer: body.reviewer,
  });

  return res.status(result.ok ? 200 : 500).json(result);
}
