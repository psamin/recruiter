import { google } from "googleapis";
import type { AddCandidatePayload } from "../types";

// ---------------------------------------------------------------------------
// GOOGLE SHEETS INTEGRATION
//
// This module appends approved/maybe candidates to a Google Sheet via a
// service account. It is designed to be SAFE TO RUN LOCALLY with no setup:
// if any required env var is missing, it logs a warning and returns a mock
// success response instead of throwing. That keeps the review flow usable in
// development before credentials are wired up.
//
// To enable real writes, set these in backend/.env (see .env.example):
//   GOOGLE_SHEETS_CLIENT_EMAIL
//   GOOGLE_SHEETS_PRIVATE_KEY
//   GOOGLE_SHEETS_SPREADSHEET_ID
//   GOOGLE_SHEETS_SHEET_NAME (optional, defaults to "Candidates")
//
// And share the target spreadsheet with the service account email as an Editor.
// ---------------------------------------------------------------------------

// Column order MUST match the header row in the sheet.
export const SHEET_COLUMNS = [
  "Name",
  "Current Role",
  "Company / Firm",
  "Location",
  "Practice Area",
  "Languages",
  "LinkedIn URL",
  "Other Profile URL",
  "Email",
  "Phone",
  "Source",
  "Fit Score",
  "Why They Match",
  "Notes",
  "Status",
  "Date Added",
  "Reviewer",
] as const;

export interface AddCandidateResult {
  ok: boolean;
  mocked: boolean;
  message: string;
}

function getConfig() {
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  // Private keys are stored with literal "\n"; convert to real newlines.
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const sheetName = process.env.GOOGLE_SHEETS_SHEET_NAME || "Candidates";

  return { clientEmail, privateKey, spreadsheetId, sheetName };
}

/** Turn a candidate payload into a single row matching SHEET_COLUMNS. */
function toRow(payload: AddCandidatePayload): (string | number)[] {
  const { candidate, status, notes, reviewer } = payload;
  return [
    candidate.name,
    candidate.title,
    candidate.company,
    candidate.location,
    candidate.practiceArea,
    candidate.languages.join(", "),
    candidate.linkedinUrl,
    candidate.profileUrl,
    candidate.email,
    candidate.phone,
    candidate.source,
    candidate.fitScore,
    candidate.whyMatch,
    notes ?? "",
    status,
    new Date().toISOString(),
    reviewer ?? "Wayco Reviewer",
  ];
}

/**
 * Appends a candidate row to the configured Google Sheet.
 *
 * Returns `{ mocked: true }` when credentials are not configured so callers
 * (and the UI) can distinguish a real write from a local no-op.
 */
export async function addCandidateToSheet(
  payload: AddCandidatePayload
): Promise<AddCandidateResult> {
  const { clientEmail, privateKey, spreadsheetId, sheetName } = getConfig();

  // --- Safe local fallback ------------------------------------------------
  if (!clientEmail || !privateKey || !spreadsheetId) {
    console.warn(
      "[googleSheets] Missing Google Sheets env vars — returning mock success. " +
        "Set GOOGLE_SHEETS_CLIENT_EMAIL, GOOGLE_SHEETS_PRIVATE_KEY and " +
        "GOOGLE_SHEETS_SPREADSHEET_ID in backend/.env to enable real writes."
    );
    console.info("[googleSheets] (mock) would append row:", toRow(payload));
    return {
      ok: true,
      mocked: true,
      message: `Mock save: ${payload.candidate.name} (no Sheets credentials configured).`,
    };
  }

  // --- Real Google Sheets write -------------------------------------------
  // This is where the live API logic runs once credentials are present.
  try {
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [toRow(payload)],
      },
    });

    return {
      ok: true,
      mocked: false,
      message: `Saved ${payload.candidate.name} to Google Sheet.`,
    };
  } catch (err) {
    // Don't crash the request — surface the failure so the UI can show it.
    console.error("[googleSheets] Failed to append row:", err);
    return {
      ok: false,
      mocked: false,
      message:
        err instanceof Error ? err.message : "Unknown Google Sheets error.",
    };
  }
}
