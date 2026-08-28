import "server-only";
import { prisma } from "@/lib/prisma";
import type { BusinessType } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";

async function getDeletedBusinessNames(): Promise<string[]> {
  const rows = await prisma.business.findMany({ select: { name: true } });
  return rows.map((r) => r.name);
}

function excludeBusinessNames(names: string[]): { notIn: string[] } | undefined {
  return names.length > 0 ? { notIn: names } : undefined;
}

function deviceSearchFilter(query: string): Prisma.DeviceRequestWhereInput {
  const contains = { contains: query, mode: "insensitive" as const };
  return {
    OR: [
      { requestId: contains },
      { businessName: contains },
      { contactPerson: contains },
      { contactNumber: contains },
      { sdrName: contains },
      { ssName: contains },
      { businessAddress: contains },
    ],
  };
}

function swappingSearchFilter(query: string): Prisma.SwappingRequestWhereInput {
  const contains = { contains: query, mode: "insensitive" as const };
  return {
    OR: [
      { requestId: contains },
      { businessName: contains },
      { contactPerson: contains },
      { contactNumber: contains },
      { sdrName: contains },
      { ssName: contains },
      { businessAddress: contains },
    ],
  };
}

/** Inclusive submittedAt range from "YYYY-MM-DD" date-input strings. */
function dateRangeFilter(
  dateFrom?: string,
  dateTo?: string,
): { gte?: Date; lte?: Date } | undefined {
  if (!dateFrom && !dateTo) return undefined;
  const range: { gte?: Date; lte?: Date } = {};

  if (dateFrom) {
    const d = new Date(`${dateFrom}T00:00:00`);
    if (!Number.isNaN(d.getTime())) range.gte = d;
  }
  if (dateTo) {
    const d = new Date(`${dateTo}T23:59:59.999`);
    if (!Number.isNaN(d.getTime())) range.lte = d;
  }

  return range;
}

export interface DeviceRequestFilters {
  businessType?: BusinessType;
  query?: string;
  sdrName?: string;
  deviceType?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function listDeviceRequests(filters: DeviceRequestFilters = {}) {
  const { businessType, query, sdrName, deviceType, dateFrom, dateTo } = filters;
  const q = query?.trim();
  const submittedAt = dateRangeFilter(dateFrom, dateTo);
  const notDeleted = excludeBusinessNames(await getDeletedBusinessNames());

  return prisma.deviceRequest.findMany({
    where: {
      ...(businessType ? { businessType } : {}),
      ...(sdrName ? { sdrName } : {}),
      ...(deviceType ? { deviceType } : {}),
      ...(submittedAt ? { submittedAt } : {}),
      ...(notDeleted ? { businessName: notDeleted } : {}),
      ...(q ? deviceSearchFilter(q) : {}),
    },
    orderBy: { submittedAt: "desc" },
  });
}

export interface SwappingRequestFilters {
  businessType?: BusinessType;
  query?: string;
  sdrName?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function listSwappingRequests(filters: SwappingRequestFilters = {}) {
  const { businessType, query, sdrName, dateFrom, dateTo } = filters;
  const q = query?.trim();
  const submittedAt = dateRangeFilter(dateFrom, dateTo);
  const notDeleted = excludeBusinessNames(await getDeletedBusinessNames());

  return prisma.swappingRequest.findMany({
    where: {
      ...(businessType ? { businessType } : {}),
      ...(sdrName ? { sdrName } : {}),
      ...(submittedAt ? { submittedAt } : {}),
      ...(notDeleted ? { businessName: notDeleted } : {}),
      ...(q ? swappingSearchFilter(q) : {}),
    },
    orderBy: { submittedAt: "desc" },
  });
}

function nonEmptySorted(values: string[]): string[] {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b),
  );
}

export async function listDeviceRequestSdrNames(): Promise<string[]> {
  const notDeleted = excludeBusinessNames(await getDeletedBusinessNames());
  const rows = await prisma.deviceRequest.findMany({
    where: notDeleted ? { businessName: notDeleted } : undefined,
    select: { sdrName: true },
  });
  return nonEmptySorted(rows.map((r) => r.sdrName));
}

export async function listDeviceRequestDeviceTypes(): Promise<string[]> {
  const notDeleted = excludeBusinessNames(await getDeletedBusinessNames());
  const rows = await prisma.deviceRequest.findMany({
    where: notDeleted ? { businessName: notDeleted } : undefined,
    select: { deviceType: true },
  });
  return nonEmptySorted(rows.map((r) => r.deviceType));
}

export async function listSwappingRequestSdrNames(): Promise<string[]> {
  const notDeleted = excludeBusinessNames(await getDeletedBusinessNames());
  const rows = await prisma.swappingRequest.findMany({
    where: notDeleted ? { businessName: notDeleted } : undefined,
    select: { sdrName: true },
  });
  return nonEmptySorted(rows.map((r) => r.sdrName));
}

export interface DeviceCategorySummary {
  category: string;
  count: number;
}

// Buckets the free-form DEVICE TYPE text into the categories Logistics
// actually reports on. Anything that doesn't match falls into "Other" so a
// new/renamed device type never silently disappears from the total.
const DEVICE_CATEGORY_RULES: { category: string; test: RegExp }[] = [
  { category: "Mono iPhones", test: /mono.*iphone/i },
  { category: "Mono Insta 360", test: /insta.?360|mono.*360/i },
  { category: "Multicam", test: /multicam|gohan/i },
  { category: "Powerbank", test: /power ?bank/i },
];

const OTHER_CATEGORY = "Other";
const POWERBANK_CATEGORY = "Powerbank";
const DEVICE_CATEGORIES = [...DEVICE_CATEGORY_RULES.map((r) => r.category), OTHER_CATEGORY];

function categorize(deviceType: string): string {
  return DEVICE_CATEGORY_RULES.find((rule) => rule.test.test(deviceType))?.category ?? OTHER_CATEGORY;
}

/** Total dispatched (deployed) devices, grouped by device type category —
 * counts both the primary request and any additional-request units on the
 * same submission, since both ship together once marked Dispatched.
 * Excludes deleted businesses, same as everywhere else. */
export async function getDeployedDeviceSummary(): Promise<{
  categories: DeviceCategorySummary[];
  totalDeployed: number;
}> {
  const notDeleted = excludeBusinessNames(await getDeletedBusinessNames());
  const dispatched = await prisma.deviceRequest.findMany({
    where: { status: "DISPATCHED", ...(notDeleted ? { businessName: notDeleted } : {}) },
    select: {
      deviceType: true,
      quantity: true,
      additionalRequestDeviceType: true,
      additionalRequestQuantity: true,
    },
  });

  const counts = new Map<string, number>(DEVICE_CATEGORIES.map((category) => [category, 0]));

  for (const { deviceType, quantity, additionalRequestDeviceType, additionalRequestQuantity } of dispatched) {
    const category = categorize(deviceType);
    counts.set(category, (counts.get(category) ?? 0) + quantity);

    if (additionalRequestDeviceType && additionalRequestQuantity) {
      const additionalCategory = categorize(additionalRequestDeviceType);
      counts.set(additionalCategory, (counts.get(additionalCategory) ?? 0) + additionalRequestQuantity);
    }
  }

  const categories = Array.from(counts, ([category, count]) => ({ category, count }));
  const totalDeployed = categories.reduce((sum, c) => sum + c.count, 0);

  return { categories, totalDeployed };
}

export type BusinessLifecycleStatus = "ACTIVE" | "PULLED_OUT";

/** One entry per business name that has at least one Device Request —
 * "Pulled Out" if their most recent Device Request is a Pull-out, "Active"
 * otherwise. Covers every business regardless of deleted state, since the
 * Trash view needs it too. */
export async function getBusinessLifecycleStatuses(): Promise<Map<string, BusinessLifecycleStatus>> {
  const rows = await prisma.deviceRequest.findMany({
    select: { businessName: true, requestType: true },
    orderBy: { submittedAt: "desc" },
  });

  const statuses = new Map<string, BusinessLifecycleStatus>();
  for (const { businessName, requestType } of rows) {
    if (statuses.has(businessName)) continue; // rows are newest-first; keep only the latest
    statuses.set(businessName, requestType === "PULL_OUT" ? "PULLED_OUT" : "ACTIVE");
  }
  return statuses;
}

export interface BusinessDeviceSummaryRow {
  businessName: string;
  /** Every device requested, by category — the primary DEVICE TYPE field. */
  categoryCounts: Record<string, number>;
  /** Total devices requested by this business, across every submission. */
  totalDeviceQty: number;
  /** Of the above, how many are on requests marked Dispatched. */
  totalDispatchedQty: number;
  /** The separate "extra units" a submission can ask for alongside its
   * primary request (ADDITIONAL REQUEST DEVICE TYPE / QUANTITY FOR
   * ADDITIONAL REQUEST), by category. */
  additionalCategoryCounts: Record<string, number>;
  totalAdditionalQty: number;
  /** Expected SD cards needed — one per device unit (primary + additional),
   * except Powerbanks, which don't use one. Compare against totalSdCards
   * (what's actually been swapped) to spot gaps. */
  expectedSdCards: number;
  totalSdCards: number;
}

export const BUSINESS_SUMMARY_CATEGORIES = DEVICE_CATEGORIES;

interface DeviceRowForSummary {
  businessName: string;
  deviceType: string;
  quantity: number;
  status: string;
  additionalRequestDeviceType: string | null;
  additionalRequestQuantity: number | null;
}

interface SwapRowForSummary {
  businessName: string;
  sdCardCount: number;
}

function aggregateBusinessRows(
  deviceRows: DeviceRowForSummary[],
  swapRows: SwapRowForSummary[],
): Map<string, BusinessDeviceSummaryRow> {
  const rows = new Map<string, BusinessDeviceSummaryRow>();

  function getRow(businessName: string): BusinessDeviceSummaryRow {
    let row = rows.get(businessName);
    if (!row) {
      row = {
        businessName,
        categoryCounts: Object.fromEntries(DEVICE_CATEGORIES.map((c) => [c, 0])),
        totalDeviceQty: 0,
        totalDispatchedQty: 0,
        additionalCategoryCounts: Object.fromEntries(DEVICE_CATEGORIES.map((c) => [c, 0])),
        totalAdditionalQty: 0,
        expectedSdCards: 0,
        totalSdCards: 0,
      };
      rows.set(businessName, row);
    }
    return row;
  }

  for (const {
    businessName,
    deviceType,
    quantity,
    status,
    additionalRequestDeviceType,
    additionalRequestQuantity,
  } of deviceRows) {
    const row = getRow(businessName);
    const category = categorize(deviceType);
    row.categoryCounts[category] += quantity;
    row.totalDeviceQty += quantity;
    if (category !== POWERBANK_CATEGORY) row.expectedSdCards += quantity;

    // Dispatching a request ships everything on it — the primary quantity
    // and any additional-request units together.
    if (status === "DISPATCHED") row.totalDispatchedQty += quantity;

    if (additionalRequestDeviceType && additionalRequestQuantity) {
      const additionalCategory = categorize(additionalRequestDeviceType);
      row.additionalCategoryCounts[additionalCategory] += additionalRequestQuantity;
      row.totalAdditionalQty += additionalRequestQuantity;
      if (additionalCategory !== POWERBANK_CATEGORY) row.expectedSdCards += additionalRequestQuantity;
      if (status === "DISPATCHED") row.totalDispatchedQty += additionalRequestQuantity;
    }
  }

  for (const { businessName, sdCardCount } of swapRows) {
    getRow(businessName).totalSdCards += sdCardCount;
  }

  return rows;
}

const SUMMARY_SELECT = {
  businessName: true,
  deviceType: true,
  quantity: true,
  status: true,
  additionalRequestDeviceType: true,
  additionalRequestQuantity: true,
} as const;

/** Per-business breakdown of everything ever requested — device quantities
 * by category plus SD cards swapped — across all requests regardless of
 * status (this counts total demand, not just what's been dispatched).
 * Deleted businesses are excluded — see getTrashedBusinessSummary. */
export async function getBusinessDeviceSummary(): Promise<BusinessDeviceSummaryRow[]> {
  const notDeleted = excludeBusinessNames(await getDeletedBusinessNames());

  const [deviceRows, swapRows] = await Promise.all([
    prisma.deviceRequest.findMany({
      where: notDeleted ? { businessName: notDeleted } : undefined,
      select: SUMMARY_SELECT,
    }),
    prisma.swappingRequest.findMany({
      where: notDeleted ? { businessName: notDeleted } : undefined,
      select: { businessName: true, sdCardCount: true },
    }),
  ]);

  const rows = aggregateBusinessRows(deviceRows, swapRows);
  return Array.from(rows.values()).sort((a, b) => a.businessName.localeCompare(b.businessName));
}

export interface TrashedBusinessRow extends BusinessDeviceSummaryRow {
  deletedBy: string;
  deletedAt: Date;
}

/** Same per-business breakdown as getBusinessDeviceSummary, but for
 * businesses currently in the Trash — their requests aren't gone, just
 * hidden from every other view until restored. */
export async function getTrashedBusinessSummary(): Promise<TrashedBusinessRow[]> {
  const deleted = await prisma.business.findMany({
    select: { name: true, deletedBy: true, deletedAt: true },
  });
  if (deleted.length === 0) return [];

  const deletedNames = deleted.map((d) => d.name);
  const deletedInfo = new Map(deleted.map((d) => [d.name, d]));

  const [deviceRows, swapRows] = await Promise.all([
    prisma.deviceRequest.findMany({
      where: { businessName: { in: deletedNames } },
      select: SUMMARY_SELECT,
    }),
    prisma.swappingRequest.findMany({
      where: { businessName: { in: deletedNames } },
      select: { businessName: true, sdCardCount: true },
    }),
  ]);

  const rows = aggregateBusinessRows(deviceRows, swapRows);

  // A business can be in Trash with no requests under its exact name
  // spelling (e.g. deleted preemptively) — still show it.
  for (const name of deletedNames) {
    if (!rows.has(name)) {
      rows.set(name, {
        businessName: name,
        categoryCounts: Object.fromEntries(DEVICE_CATEGORIES.map((c) => [c, 0])),
        totalDeviceQty: 0,
        totalDispatchedQty: 0,
        additionalCategoryCounts: Object.fromEntries(DEVICE_CATEGORIES.map((c) => [c, 0])),
        totalAdditionalQty: 0,
        expectedSdCards: 0,
        totalSdCards: 0,
      });
    }
  }

  return Array.from(rows.values())
    .map((row) => {
      const info = deletedInfo.get(row.businessName)!;
      return { ...row, deletedBy: info.deletedBy, deletedAt: info.deletedAt };
    })
    .sort((a, b) => b.deletedAt.getTime() - a.deletedAt.getTime());
}
