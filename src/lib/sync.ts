import "server-only";
import { prisma } from "@/lib/prisma";
import { fetchSheetRows } from "@/lib/google-sheets";
import { TEAM_MEMBERS } from "@/lib/team";
import type {
  BusinessType,
  DeviceRequestType,
  RequestStatus,
} from "@/generated/prisma/enums";
import type {
  DeviceRequestCreateManyInput,
  SwappingRequestCreateManyInput,
} from "@/generated/prisma/models";

function normalizeHeader(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]+/g, " ").trim();
}

type ColumnIndex = Map<string, number>;

function buildColumnIndex(headerRow: string[]): ColumnIndex {
  const map: ColumnIndex = new Map();
  headerRow.forEach((header, i) => map.set(normalizeHeader(header), i));
  return map;
}

/** Matches a Sheet header against candidate labels — exact normalized match
 * first, falling back to a substring match so minor wording drift in the
 * form (a re-typed question, an added colon) doesn't break the sync. */
function findColumn(index: ColumnIndex, ...candidates: string[]): number {
  for (const candidate of candidates) {
    const exact = index.get(normalizeHeader(candidate));
    if (exact !== undefined) return exact;
  }
  for (const [header, i] of index) {
    if (candidates.some((c) => header.includes(normalizeHeader(c)))) return i;
  }
  return -1;
}

function cell(row: string[], index: number): string {
  return index >= 0 ? (row[index] ?? "").trim() : "";
}

function parseTimestamp(raw: string): Date {
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function parseQuantity(raw: string): number {
  const n = parseInt(raw.replace(/[^0-9-]/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

/** Like parseQuantity, but for an optional field — an empty/unparseable
 * value means "nothing requested here", not "1". */
function parseOptionalQuantity(raw: string): number | null {
  if (!raw.trim()) return null;
  const n = parseInt(raw.replace(/[^0-9-]/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function mapDeviceRequestType(raw: string): DeviceRequestType {
  const v = raw.toUpperCase();
  if (v.includes("REPLAC")) return "REPLACEMENT";
  if (v.includes("PULL")) return "PULL_OUT";
  return "DROP_OFF";
}

function mapBusinessType(raw: string): BusinessType {
  const v = raw.toUpperCase();
  if (v.includes("EXTERNAL")) return "EXTERNAL_PARTNER";
  if (v.includes("OUTBOUND")) return "OUTBOUND";
  return "DIRECT_BUSINESS";
}

// The sheet's own "Status" column (from the existing Apps Script tracker)
// has more states than ours (New / Completed / Cancelled at least). We only
// track dispatched vs. not, so anything other than "Completed" starts as
// In Progress — that's the accurate default for "New" and the safe default
// for "Cancelled" (it was never actually dispatched).
function mapInitialStatus(raw: string): RequestStatus {
  return raw.trim().toUpperCase() === "COMPLETED" ? "DISPATCHED" : "IN_PROGRESS";
}

/** The Sheet's "Updated By" column is whatever Google Forms/Apps Script
 * stamped it with — usually a work email ("arnee@atlascapture.io"). Maps
 * that back to the roster's display name ("Arnee") so attribution reads the
 * same whether the status was set here or on the Sheet; falls back to the
 * email's local part, then the raw value, if nothing matches. */
function formatSheetUpdatedBy(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;

  const localPart = value.includes("@") ? value.split("@")[0] : value;
  const match = TEAM_MEMBERS.find((name) => {
    const first = name.split(" ")[0];
    return first.toLowerCase() === localPart.toLowerCase();
  });
  if (match) return match;

  return localPart.charAt(0).toUpperCase() + localPart.slice(1);
}

function isBlankRow(row: string[]): boolean {
  return row.every((c) => !c || !c.trim());
}

/** The sheet's "Request ID" column (e.g. "REQ-0132") if present, otherwise a
 * synthesized id from the row's position — keeps every row syncable even for
 * older entries the tracker never stamped with a real Request ID. */
function resolveRequestId(row: string[], idx: number, sheetRowIndex: number): string {
  return cell(row, idx) || `ROW-${sheetRowIndex}`;
}

interface Completion {
  requestId: string;
  dispatchedAt: Date;
  lastChangedBy: string | null;
}

/** Rows the Sheet marks "Completed" that our DB still shows In Progress —
 * catches up rows whose status changed directly on the Sheet (the old Apps
 * Script tracker workflow logistics still uses day-to-day) instead of
 * through this app's own status toggle. Attributes the change to the
 * Sheet's own "Updated By" column, same as a manual toggle would. Never
 * touches a row that's already Dispatched here, so a status set from this
 * app's UI is never overwritten by stale Sheet state. */
function findCompletions(
  dataRows: string[][],
  idx: { requestId: number; status: number; lastUpdated: number; sheetUpdatedBy: number },
  inProgressIds: Set<string>,
): Completion[] {
  const completions: Completion[] = [];
  dataRows.forEach((row, i) => {
    if (isBlankRow(row)) return;
    const sheetRowIndex = i + 2;
    const requestId = resolveRequestId(row, idx.requestId, sheetRowIndex);
    if (!inProgressIds.has(requestId)) return;
    if (cell(row, idx.status).toUpperCase() !== "COMPLETED") return;

    const lastUpdated = cell(row, idx.lastUpdated);
    completions.push({
      requestId,
      dispatchedAt: lastUpdated ? parseTimestamp(lastUpdated) : new Date(),
      lastChangedBy: formatSheetUpdatedBy(cell(row, idx.sheetUpdatedBy)),
    });
  });
  return completions;
}

export interface SyncResult {
  created: number;
  /** Existing rows the Sheet's own Status/Updated By caught up to Dispatched. */
  updated: number;
  total: number;
}

export async function syncDeviceRequests(): Promise<SyncResult> {
  const spreadsheetId = process.env.GOOGLE_DEVICE_REQUEST_SPREADSHEET_ID;
  const gid = process.env.GOOGLE_DEVICE_REQUEST_SHEET_GID;
  if (!spreadsheetId) {
    throw new Error("GOOGLE_DEVICE_REQUEST_SPREADSHEET_ID is not set.");
  }
  if (!gid) {
    throw new Error("GOOGLE_DEVICE_REQUEST_SHEET_GID is not set.");
  }

  const rows = await fetchSheetRows(spreadsheetId, gid);
  if (rows.length < 2) return { created: 0, updated: 0, total: 0 };

  const [header, ...dataRows] = rows;
  const col = buildColumnIndex(header);
  const idx = {
    requestId: findColumn(col, "Request ID"),
    status: findColumn(col, "Status"),
    timestamp: findColumn(col, "Timestamp"),
    email: findColumn(col, "Email Address", "Email"),
    requestDate: findColumn(col, "DEVICE REQUEST DATE"),
    requestTime: findColumn(col, "DEVICE REQUEST TIME"),
    requestType: findColumn(col, "DEVICE REQUEST TYPE"),
    sdrName: findColumn(col, "SDR NAME"),
    ssName: findColumn(col, "SS NAME"),
    businessName: findColumn(col, "BUSINESS NAME"),
    contactPerson: findColumn(col, "CONTACT PERSON"),
    contactNumber: findColumn(col, "CONTACT NUMBER"),
    businessType: findColumn(col, "BUSINESS TYPE"),
    businessAddress: findColumn(col, "BUSINESS ADDRESS"),
    deliveryMode: findColumn(col, "DELIVERY MODE"),
    deviceType: findColumn(col, "DEVICE TYPE"),
    quantity: findColumn(col, "QUANTITY FOR DEVICE TYPE", "QUANTITY"),
    additionalRequestDeviceType: findColumn(col, "ADDITIONAL REQUEST DEVICE TYPE"),
    additionalRequestQuantity: findColumn(col, "QUANTITY FOR ADDITIONAL REQUEST"),
    replacementIssue: findColumn(col, "IF REPLACEMENT, PROVIDE THE ISSUE & TROUBLESHOOTING PERFORMED"),
    lastUpdated: findColumn(col, "Last Updated"),
    sheetUpdatedBy: findColumn(col, "Updated By"),
  };

  const existing = await prisma.deviceRequest.findMany({
    select: { requestId: true },
  });
  const existingIds = new Set(existing.map((r) => r.requestId));

  const toCreate: DeviceRequestCreateManyInput[] = [];

  dataRows.forEach((row, i) => {
    if (isBlankRow(row)) return;
    const sheetRowIndex = i + 2; // +1 for header row, +1 for 1-based row numbers
    const requestId = resolveRequestId(row, idx.requestId, sheetRowIndex);
    if (existingIds.has(requestId)) return;

    const status = mapInitialStatus(cell(row, idx.status));

    toCreate.push({
      requestId,
      submittedAt: parseTimestamp(cell(row, idx.timestamp)),
      requesterEmail: cell(row, idx.email),
      requestDate: cell(row, idx.requestDate),
      requestTime: cell(row, idx.requestTime),
      requestType: mapDeviceRequestType(cell(row, idx.requestType)),
      sdrName: cell(row, idx.sdrName),
      ssName: cell(row, idx.ssName) || null,
      businessType: mapBusinessType(cell(row, idx.businessType)),
      businessName: cell(row, idx.businessName),
      businessAddress: cell(row, idx.businessAddress),
      contactPerson: cell(row, idx.contactPerson),
      contactNumber: cell(row, idx.contactNumber),
      deliveryMode: cell(row, idx.deliveryMode),
      deviceType: cell(row, idx.deviceType),
      quantity: parseQuantity(cell(row, idx.quantity)),
      additionalRequestDeviceType: cell(row, idx.additionalRequestDeviceType) || null,
      additionalRequestQuantity: parseOptionalQuantity(cell(row, idx.additionalRequestQuantity)),
      replacementIssue: cell(row, idx.replacementIssue) || null,
      status,
      dispatchedAt: status === "DISPATCHED" ? new Date() : null,
    });
  });

  if (toCreate.length > 0) {
    await prisma.deviceRequest.createMany({ data: toCreate, skipDuplicates: true });
  }

  const inProgress = await prisma.deviceRequest.findMany({
    where: { status: "IN_PROGRESS" },
    select: { requestId: true },
  });
  const completions = findCompletions(
    dataRows,
    idx,
    new Set(inProgress.map((r) => r.requestId)),
  );
  await Promise.all(
    completions.map((c) =>
      prisma.deviceRequest.update({
        where: { requestId: c.requestId },
        data: {
          status: "DISPATCHED",
          dispatchedAt: c.dispatchedAt,
          lastChangedBy: c.lastChangedBy,
        },
      }),
    ),
  );

  return { created: toCreate.length, updated: completions.length, total: dataRows.length };
}

export async function syncSwappingRequests(): Promise<SyncResult> {
  const spreadsheetId = process.env.GOOGLE_SWAPPING_REQUEST_SPREADSHEET_ID;
  const gid = process.env.GOOGLE_SWAPPING_REQUEST_SHEET_GID;
  if (!spreadsheetId) {
    throw new Error("GOOGLE_SWAPPING_REQUEST_SPREADSHEET_ID is not set.");
  }
  if (!gid) {
    throw new Error("GOOGLE_SWAPPING_REQUEST_SHEET_GID is not set.");
  }

  const rows = await fetchSheetRows(spreadsheetId, gid);
  if (rows.length < 2) return { created: 0, updated: 0, total: 0 };

  const [header, ...dataRows] = rows;
  const col = buildColumnIndex(header);
  const idx = {
    requestId: findColumn(col, "Request ID"),
    status: findColumn(col, "Status"),
    timestamp: findColumn(col, "Timestamp"),
    email: findColumn(col, "Email Address", "Email"),
    swappingDate: findColumn(col, "SWAPPING DATE"),
    swappingTime: findColumn(col, "SWAPPING TIME"),
    sdrName: findColumn(col, "SDR NAME"),
    ssName: findColumn(col, "SS NAME"),
    businessType: findColumn(col, "BUSINESS TYPE"),
    businessName: findColumn(col, "BUSINESS NAME"),
    businessAddress: findColumn(col, "BUSINESS ADDRESS"),
    contactPerson: findColumn(col, "CONTACT PERSON"),
    contactNumber: findColumn(col, "CONTACT NUMBER"),
    sdCardCount: findColumn(col, "NUMBER OF SD CARD TO SWAP", "SD CARD"),
    lastUpdated: findColumn(col, "Last Updated"),
    sheetUpdatedBy: findColumn(col, "Updated By"),
  };

  const existing = await prisma.swappingRequest.findMany({
    select: { requestId: true },
  });
  const existingIds = new Set(existing.map((r) => r.requestId));

  const toCreate: SwappingRequestCreateManyInput[] = [];

  dataRows.forEach((row, i) => {
    if (isBlankRow(row)) return;
    const sheetRowIndex = i + 2;
    const requestId = resolveRequestId(row, idx.requestId, sheetRowIndex);
    if (existingIds.has(requestId)) return;

    const status = mapInitialStatus(cell(row, idx.status));

    toCreate.push({
      requestId,
      submittedAt: parseTimestamp(cell(row, idx.timestamp)),
      requesterEmail: cell(row, idx.email),
      swappingDate: cell(row, idx.swappingDate),
      swappingTime: cell(row, idx.swappingTime),
      sdrName: cell(row, idx.sdrName),
      ssName: cell(row, idx.ssName) || null,
      businessType: mapBusinessType(cell(row, idx.businessType)),
      businessName: cell(row, idx.businessName),
      businessAddress: cell(row, idx.businessAddress),
      contactPerson: cell(row, idx.contactPerson),
      contactNumber: cell(row, idx.contactNumber),
      sdCardCount: parseQuantity(cell(row, idx.sdCardCount)),
      status,
      dispatchedAt: status === "DISPATCHED" ? new Date() : null,
    });
  });

  if (toCreate.length > 0) {
    await prisma.swappingRequest.createMany({
      data: toCreate,
      skipDuplicates: true,
    });
  }

  const inProgress = await prisma.swappingRequest.findMany({
    where: { status: "IN_PROGRESS" },
    select: { requestId: true },
  });
  const completions = findCompletions(
    dataRows,
    idx,
    new Set(inProgress.map((r) => r.requestId)),
  );
  await Promise.all(
    completions.map((c) =>
      prisma.swappingRequest.update({
        where: { requestId: c.requestId },
        data: {
          status: "DISPATCHED",
          dispatchedAt: c.dispatchedAt,
          lastChangedBy: c.lastChangedBy,
        },
      }),
    ),
  );

  return { created: toCreate.length, updated: completions.length, total: dataRows.length };
}
