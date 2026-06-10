import type { Request, Response } from "express";
import { sourceCandidates } from "../services/llm.service";
import type { SearchParams } from "../types";

// POST /api/candidates
// Returns candidate leads for a recruiting search. Delegates to the LLM
// sourcing agent (Claude + web search), which falls back to mock data when
// ANTHROPIC_API_KEY is not configured.
export async function searchCandidates(req: Request, res: Response) {
  const body = (req.body ?? {}) as Partial<SearchParams>;

  const params: SearchParams = {
    prompt: body.prompt?.trim() ?? "",
    location: body.location?.trim() ?? "",
    role: body.role?.trim() ?? "",
    industry: body.industry?.trim() ?? "",
    language: body.language?.trim() ?? "",
    maxCandidates:
      typeof body.maxCandidates === "number" && body.maxCandidates > 0
        ? Math.floor(body.maxCandidates)
        : 20,
  };

  if (!params.prompt) {
    return res.status(400).json({ error: "A recruiting prompt is required." });
  }

  const result = await sourceCandidates(params);
  // `sourced` ("llm" | "mock") and `note` let the UI show how leads were found.
  return res.json({
    candidates: result.candidates,
    sourced: result.sourced,
    note: result.note,
  });
}
