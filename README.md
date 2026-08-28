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
in the "all" view), filters (**search**, **SDR**, **device type** — device
requests only, **date range**), an **Export CSV** button that respects
whatever filters are active, and a **status** control — click **In
Progress** or **Dispatched** directly rather than toggling. Whoever is
logged in when they change a status gets recorded in the **Updated By**
column (see "Identity" below). A **Summary** page totals dispatched devices
by type (Mono iPhones / Mono Insta 360 / Multicam / Powerbank / Other),
plus a per-business breakdown (see "Additional requests" below).

### Additional requests

A device request submission can carry a second, smaller request alongside
its primary one — the form's `ADDITIONAL REQUEST DEVICE TYPE` /
`QUANTITY FOR ADDITIONAL REQUEST` fields (e.g. a business asking for 5
Multicams up front, plus 3 more of something else on the same submission,
or filled in on a separate later submission for a business that already has
a device). The Summary's per-business table tracks these separately from
the primary request, but **they count together for dispatch**: marking a
request Dispatched ships both the primary and additional quantities, so
`Total Dispatched` = primary + additional. The top category cards work the
same way.

Each device unit dispatched (primary or additional) is assumed to need one
SD card, **except Powerbanks** — the Summary table shows this as an
"Expected" SD card count next to the actual number swapped (from the
Swapping Request form), so a gap between the two is visible at a glance.

### Identity

Login picks a name from a fixed roster (`src/lib/team.ts`) alongside the
shared PIN — everyone uses the same `ADMIN_PIN`, but the name is what's
recorded in `lastChangedBy` when someone sets a request's status, and is
validated server-side too (not just a client-side dropdown), so the tracker
only recognizes the Logistics team. It's not a real per-person account (no
password, no permissions difference) — to change who's on the roster, edit
`TEAM_MEMBERS` in `src/lib/team.ts`.

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

## Deployment

Works on either Netlify or Vercel — both just need the same env vars set in
their dashboard (everything in `.env.example`) and a build command that runs
migrations before building, since there's no separate migration step in
either platform's pipeline:

- **Netlify** — `netlify.toml` is already set up (`prisma migrate deploy &&
  next build`, `@netlify/plugin-nextjs`).
- **Vercel** — `vercel.json` sets `framework: nextjs` and the same build
  command. If a deploy ever fails with `No Output Directory named "public"
  found`, the project's Framework Preset got set to something other than
  "Next.js" in Vercel's dashboard (Settings → Build and Development
  Settings) — switch it back and clear any manual Output Directory override.

## Project structure

- `src/app/(dashboard)/device-requests/` / `swapping-requests/` — all-requests
  views, plus `direct-business/` and `external-partner/` sub-views.
- `src/app/(dashboard)/summary/` — deployed-devices summary.
- `src/components/DeviceRequestsTable.tsx` / `SwappingRequestsTable.tsx` —
  shared table markup used by both the "all" and filtered pages.
- `src/lib/google-sheets.ts` — fetches + parses each Sheet's public CSV export.
- `src/lib/sync.ts` — parses Sheet rows into `DeviceRequest` /
  `SwappingRequest` rows, deduped by the Sheet's own `Request ID` column.
- `src/lib/actions/request-actions.ts` — server actions: set status (records
  `lastChangedBy` from the session), sync.
- `src/lib/admin-session.ts` / `src/lib/admin-auth.ts` — signed, short-lived
  admin session cookie.
- `src/lib/team.ts` — the login roster.
- `src/app/api/export/` — CSV export routes, one per request type, filtered
  the same way as the on-screen table.
- `src/components/RequestFilters.tsx` — search/SDR/device/date filter form
  shared by all six request views.
- `src/proxy.ts` — protects the dashboard routes server-side.
