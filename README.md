# Logistics Tracker

Device Request and Swapping Request tracker for the Atlas Capture Logistics PH
team, built with Next.js (App Router), TypeScript, Tailwind CSS, and Prisma on
Postgres.

Requests are pulled in from the Google Sheets that sit behind these two forms:

- **Device Request** (Drop-off / Replacement / Pull-out) — spreadsheet
  `11OVzC0OtMRcIR47Yox7EjIzzTyemjvAauFziL1P_7To`
- **Swapping Request** (SD card swaps) — spreadsheet
  `10c99kmnkPc7SDQxMTGW5W4QeeVGq2nGNDnzTfB6ZIOw`

Each has an **all requests** view plus **External Partner** / **Direct
Business** sub-sections in the sidebar (Outbound-type requests only show up
in the "all" view). Each request shows a **status** you click to flip
between **In Progress** (amber) and **Dispatched** (green). A **Summary**
page totals dispatched devices by type (Mono iPhones / Mono Insta 360 /
Multicam / Other).

### About the existing "Status" column in the Sheets

Both response Sheets already have `Request ID`, `Status`, `Assigned To`, and
`Remarks` columns bolted on by the older Apps Script tracker — this app
doesn't touch those, it only reads them. On sync:

- `Request ID` (e.g. `REQ-0132`) is used to dedupe, so re-running the sync
  never creates duplicates or resets a status you've set here. Rows without
  one (older entries) get a synthesized `ROW-<n>` id instead.
- The Sheet's `Status` seeds this app's status **only when a request is
  first imported**: `Completed` → Dispatched, anything else (`New`,
  `Cancelled`) → In Progress. After that, toggling status here doesn't write
  back to the Sheet, and re-syncing doesn't override what you've set here.

## Getting started

```bash
npm install
npx prisma migrate deploy   # applies the schema to DATABASE_URL
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Copy `.env.example` to `.env` and fill in:

- `DATABASE_URL` / `DIRECT_DATABASE_URL` — Postgres connection strings (e.g. Neon).
- `ADMIN_PIN` — PIN required to log in.
- `ADMIN_SESSION_SECRET` — random secret signing the session cookie (`openssl rand -hex 32`).
- The `GOOGLE_*` and `SYNC_SECRET` vars below — the spreadsheet IDs are
  already filled in and need no further setup (next section).

## Connecting the Google Forms

The app doesn't talk to the Forms directly — it reads each form's response
Sheet via its public CSV export. **No Google Cloud project, service account,
or credentials needed** — this only works because both response Sheets are
shared as "Anyone with the link can view" (check via the Sheet's **Share**
button if a sync ever starts failing; re-enable that if someone's turned it
off). The `.env.example` spreadsheet IDs already point at the real sheets, so
there's nothing to configure here beyond the database.

If that sharing is ever intentionally locked down for privacy, `fetchSheetRows`
in `src/lib/google-sheets.ts` is the one place that would need to switch to
an authenticated Sheets API call (service account) instead.

**Sync reads by tab gid, not tab name** — `.../export?format=csv&gid=<id>`,
not the `tqx=out:csv&sheet=<name>` variant. The name-based export silently
respects whatever Filter View a team member last had open on that tab (it
once returned 27 of 189 real device request rows with no error at all), while
gid-based export always reads the tab's full, unfiltered data. If a tab's gid
ever changes (a new tab is added/reordered), open that tab, check the URL for
`gid=<numbers>`, and update `GOOGLE_DEVICE_REQUEST_SHEET_GID` /
`GOOGLE_SWAPPING_REQUEST_SHEET_GID` accordingly.

### Sync

- Click **"Sync from Google Forms"** on any request page to pull in new
  submissions on demand.
- For hands-off updates, set `SYNC_SECRET` and point a free external cron
  (e.g. [cron-job.org](https://cron-job.org), a scheduled GitHub Action) at
  `POST /api/sync` every few minutes, with header
  `Authorization: Bearer <SYNC_SECRET>`.

## Project structure

- `src/app/(dashboard)/device-requests/` / `swapping-requests/` — all-requests
  views, plus `direct-business/` and `external-partner/` sub-views.
- `src/app/(dashboard)/summary/` — deployed-devices summary.
- `src/components/DeviceRequestsTable.tsx` / `SwappingRequestsTable.tsx` —
  shared table markup used by both the "all" and filtered pages.
- `src/lib/google-sheets.ts` — fetches + parses each Sheet's public CSV export.
- `src/lib/sync.ts` — parses Sheet rows into `DeviceRequest` /
  `SwappingRequest` rows, deduped by the Sheet's own `Request ID` column.
- `src/lib/actions/request-actions.ts` — server actions: status toggle, sync.
- `src/lib/admin-session.ts` / `src/lib/admin-auth.ts` — signed, short-lived
  admin session cookie.
- `src/proxy.ts` — protects the dashboard routes server-side.
