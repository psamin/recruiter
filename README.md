# Wayco Sourcing — Candidate Review Board (MVP)

An internal AI candidate review tool. Enter a recruiting prompt, review candidate
leads one at a time as cards, and click **Yes / Maybe / No**. Approved and Maybe
candidates are saved to a connected Google Sheet.

> **Compliance note:** This MVP does **not** scrape LinkedIn or run any browser
> automation. LinkedIn is treated as an external profile link only. Candidate
> data is mocked and structured so a compliant search/sourcing API can be wired
> in later.

## Architecture

This is an npm-workspaces monorepo with a clean frontend / backend split:

```
recruiter/
├── frontend/              # Next.js 15 (App Router) + Tailwind — UI only
│   ├── app/               # pages, layout, global styles
│   ├── components/        # SearchForm, CandidateCard
│   └── lib/               # api.ts (backend client), types.ts
│
├── backend/               # Express + TypeScript REST API (layered)
│   └── src/
│       ├── index.ts             # server bootstrap
│       ├── app.ts               # express app (CORS, json, routes)
│       ├── config/env.ts        # env loading
│       ├── routes/              # route definitions
│       ├── controllers/         # request/response handling + validation
│       ├── services/            # business logic (search, Google Sheets)
│       ├── data/                # mock candidate dataset
│       └── types/               # shared TS types
│
└── package.json           # workspace root + combined dev script
```

The frontend talks to the backend over HTTP (`NEXT_PUBLIC_API_URL`). The backend
owns all data access and the Google Sheets integration.

## Tech stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend:** Express, TypeScript, `googleapis`, CORS, dotenv

## Run it

From the repo root (installs both workspaces):

```bash
npm install
npm run dev
```

- Backend → http://localhost:4000
- Frontend → http://localhost:3000

`npm run dev` runs both together via `concurrently`. To run individually:

```bash
npm run dev:backend
npm run dev:frontend
```

Production build:

```bash
npm run build        # builds backend (tsc) then frontend (next build)
```

No environment setup is needed to demo — Google Sheets export falls back to a
mock success when credentials are absent.

## API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Health check |
| `POST` | `/api/candidates` | Returns candidate leads for a search (`SearchParams` body) |
| `POST` | `/api/sheets/add-candidate` | Appends an approved/maybe candidate to the sheet |

## Configuration

**Frontend** (`frontend/.env.local`, copy from `.env.local.example`):

```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

**Backend** (`backend/.env`, copy from `.env.example`):

```
PORT=4000
CORS_ORIGINS=http://localhost:3000

# Optional — enables live web sourcing + scoring via Claude.
# Missing → /api/candidates falls back to mock candidates.
ANTHROPIC_API_KEY=

# Optional — enables real Google Sheets writes:
GOOGLE_SHEETS_CLIENT_EMAIL=...
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEETS_SPREADSHEET_ID=...
GOOGLE_SHEETS_SHEET_NAME=Candidates   # optional
```

### Google Sheets setup (optional, to enable real writes)

1. Create a Google Cloud service account and download its JSON key.
2. Create a Google Sheet and share it with the service account email as **Editor**.
3. Fill the `GOOGLE_SHEETS_*` vars in `backend/.env`.
4. Add a header row to the sheet matching the columns below.

### Sheet columns

`Name`, `Current Role`, `Company / Firm`, `Location`, `Practice Area`,
`Languages`, `LinkedIn URL`, `Other Profile URL`, `Email`, `Phone`, `Source`,
`Fit Score`, `Why They Match`, `Notes`, `Status`, `Date Added`, `Reviewer`

## Candidate sourcing (the "agent")

`POST /api/candidates` runs through `backend/src/services/llm.service.ts`:

- **With `ANTHROPIC_API_KEY`:** Claude (`claude-opus-4-8`) uses Anthropic's
  server-side **web search** tool to source real leads from the public web and
  scores each against the prompt (`fitScore` / `summary` / `whyMatch`). Results
  include a `source` URL. The API response carries `sourced: "llm"`.
- **Without the key:** falls back to the mock dataset (`sourced: "mock"`).

Compliance: this does **not** scrape LinkedIn or run browser automation — it's
public web search with citations. Every result is a *lead* to verify in the
review board. To also let the agent open individual pages, add the `web_fetch`
tool (needs its beta header on the current SDK).

## What's mocked vs. real

- **Mocked (fallback):** mock dataset in `backend/src/data/mockCandidates.ts` +
  deterministic ranking in `services/candidates.service.ts`. Used when
  `ANTHROPIC_API_KEY` is absent or sourcing fails. Google Sheets export when no
  Sheets credentials are set.
- **Real:** the Claude web-sourcing agent (with key), the full review UI/state,
  the Express API + CORS, and the Google Sheets append (with credentials).

## Next steps

- Add the `web_fetch` tool so the agent can read full pages, not just snippets.
- Optionally layer in a dedicated people-search API for verified contact data.
- Persist review sessions (DB) instead of in-memory frontend state.
- Add auth + per-reviewer tracking (the `Reviewer` column is already supported).
