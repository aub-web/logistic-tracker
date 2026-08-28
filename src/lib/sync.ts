import "server-only";
import { prisma } from "@/lib/prisma";
import { fetchSheetRows } from "@/lib/google-sheets";
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

function isBlankRow(row: string[]): boolean {
  return row.every((c) => !c || !c.trim());
}

/** The sheet's "Request ID" column (e.g. "REQ-0132") if present, otherwise a
 * synthesized id from the row's position — keeps every row syncable even for
 * older entries the tracker never stamped with a real Request ID. */
function resolveRequestId(row: string[], idx: number, sheetRowIndex: number): string {
  return cell(row, idx) || `ROW-${sheetRowIndex}`;
}

export interface SyncResult {
  created: number;
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
  if (rows.length < 2) return { created: 0, total: 0 };

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
      status,
      dispatchedAt: status === "DISPATCHED" ? new Date() : null,
    });
  });

  if (toCreate.length > 0) {
    await prisma.deviceRequest.createMany({ data: toCreate, skipDuplicates: true });
  }

  return { created: toCreate.length, total: dataRows.length };
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
  if (rows.length < 2) return { created: 0, total: 0 };

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

  return { created: toCreate.length, total: dataRows.length };
}
