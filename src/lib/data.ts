import "server-only";
import { prisma } from "@/lib/prisma";
import type { BusinessType, DeviceRequestType } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";

async function getDeletedBusinessNames(): Promise<string[]> {
  const rows = await prisma.business.findMany({ select: { name: true } });
  return rows.map((r) => r.name);
}

async function getPulledOutBusinessNames(): Promise<string[]> {
  const statuses = await getBusinessLifecycleStatuses();
  return [...statuses.entries()].filter(([, s]) => s === "PULLED_OUT").map(([name]) => name);
}

/** Deleted (Trash) + Pulled Out business names — the set hidden from every
 * "normal" view (Device Request, Swapping Request, Summary). A Pulled Out
 * business only shows up in its own dedicated section, same idea as Trash;
 * a business that's both stays in Trash only. */
async function getExcludedBusinessNames(): Promise<string[]> {
  const [deleted, pulledOut] = await Promise.all([
    getDeletedBusinessNames(),
    getPulledOutBusinessNames(),
  ]);
  return [...new Set([...deleted, ...pulledOut])];
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
  requestType?: DeviceRequestType;
  dateFrom?: string;
  dateTo?: string;
}

export async function listDeviceRequests(filters: DeviceRequestFilters = {}) {
  const { businessType, query, sdrName, deviceType, requestType, dateFrom, dateTo } = filters;
  const q = query?.trim();
  const submittedAt = dateRangeFilter(dateFrom, dateTo);
  const visibleFilter = excludeBusinessNames(await getExcludedBusinessNames());

  return prisma.deviceRequest.findMany({
    where: {
      ...(businessType ? { businessType } : {}),
      ...(sdrName ? { sdrName } : {}),
      ...(deviceType ? { deviceType } : {}),
      ...(requestType ? { requestType } : {}),
      ...(submittedAt ? { submittedAt } : {}),
      ...(visibleFilter ? { businessName: visibleFilter } : {}),
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
  const visibleFilter = excludeBusinessNames(await getExcludedBusinessNames());

  return prisma.swappingRequest.findMany({
    where: {
      ...(businessType ? { businessType } : {}),
      ...(sdrName ? { sdrName } : {}),
      ...(submittedAt ? { submittedAt } : {}),
      ...(visibleFilter ? { businessName: visibleFilter } : {}),
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
  const visibleFilter = excludeBusinessNames(await getExcludedBusinessNames());
  const rows = await prisma.deviceRequest.findMany({
    where: visibleFilter ? { businessName: visibleFilter } : undefined,
    select: { sdrName: true },
  });
  return nonEmptySorted(rows.map((r) => r.sdrName));
}

export async function listDeviceRequestDeviceTypes(): Promise<string[]> {
  const visibleFilter = excludeBusinessNames(await getExcludedBusinessNames());
  const rows = await prisma.deviceRequest.findMany({
    where: visibleFilter ? { businessName: visibleFilter } : undefined,
    select: { deviceType: true },
  });
  return nonEmptySorted(rows.map((r) => r.deviceType));
}

export async function listSwappingRequestSdrNames(): Promise<string[]> {
  const visibleFilter = excludeBusinessNames(await getExcludedBusinessNames());
  const rows = await prisma.swappingRequest.findMany({
    where: visibleFilter ? { businessName: visibleFilter } : undefined,
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
const DEVICE_CATEGORIES = [...DEVICE_CATEGORY_RULES.map((r) => r.category), OTHER_CATEGORY];

function categorize(deviceType: string): string {
  return DEVICE_CATEGORY_RULES.find((rule) => rule.test.test(deviceType))?.category ?? OTHER_CATEGORY;
}

/** Net devices currently in the field, grouped by device type category —
 * Drop-off adds, Pull-out subtracts, Replacement doesn't change the count
 * (it's a straight swap of an already-deployed unit, not a net-new or
 * net-removed one). Counts both the primary request and any
 * additional-request units on the same submission (same sign as the
 * primary), since both ship together once marked Dispatched. Excludes
 * deleted/pulled-out businesses, same as everywhere else. */
export async function getDeployedDeviceSummary(businessType?: BusinessType): Promise<{
  categories: DeviceCategorySummary[];
  totalDeployed: number;
}> {
  const visibleFilter = excludeBusinessNames(await getExcludedBusinessNames());
  const dispatched = await prisma.deviceRequest.findMany({
    where: {
      status: "DISPATCHED",
      requestType: { in: ["DROP_OFF", "PULL_OUT"] },
      ...(businessType ? { businessType } : {}),
      ...(visibleFilter ? { businessName: visibleFilter } : {}),
    },
    select: {
      requestType: true,
      deviceType: true,
      quantity: true,
      additionalRequestDeviceType: true,
      additionalRequestQuantity: true,
    },
  });

  const counts = new Map<string, number>(DEVICE_CATEGORIES.map((category) => [category, 0]));

  for (const {
    requestType,
    deviceType,
    quantity,
    additionalRequestDeviceType,
    additionalRequestQuantity,
  } of dispatched) {
    const sign = requestType === "PULL_OUT" ? -1 : 1;
    const category = categorize(deviceType);
    counts.set(category, (counts.get(category) ?? 0) + sign * quantity);

    if (additionalRequestDeviceType && additionalRequestQuantity) {
      const additionalCategory = categorize(additionalRequestDeviceType);
      counts.set(additionalCategory, (counts.get(additionalCategory) ?? 0) + sign * additionalRequestQuantity);
    }
  }

  const categories = Array.from(counts, ([category, count]) => ({ category, count }));
  const totalDeployed = categories.reduce((sum, c) => sum + c.count, 0);

  return { categories, totalDeployed };
}

export interface DailyDispatchedRow {
  date: string; // "YYYY-MM-DD", Manila time
  total: number;
}

/** Gross devices dispatched per day (Manila time) — every Dispatched
 * request counts here regardless of type (Drop-off, Replacement, or
 * Pull-out), unlike getDeployedDeviceSummary's net field count. This is
 * "how much did logistics dispatch on this day", not "how many devices are
 * currently out". Primary + additional quantities both count, since both
 * ship together. Filterable by dispatchedAt date range. */
export async function getDailyDispatchedTotals(
  businessType?: BusinessType,
  dateFrom?: string,
  dateTo?: string,
): Promise<DailyDispatchedRow[]> {
  const visibleFilter = excludeBusinessNames(await getExcludedBusinessNames());
  const range = dateRangeFilter(dateFrom, dateTo);

  const dispatched = await prisma.deviceRequest.findMany({
    where: {
      status: "DISPATCHED",
      dispatchedAt: range ? range : { not: null },
      ...(businessType ? { businessType } : {}),
      ...(visibleFilter ? { businessName: visibleFilter } : {}),
    },
    select: { dispatchedAt: true, quantity: true, additionalRequestQuantity: true },
  });

  const totals = new Map<string, number>();
  for (const { dispatchedAt, quantity, additionalRequestQuantity } of dispatched) {
    if (!dispatchedAt) continue;
    const dateKey = dispatchedAt.toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
    const total = quantity + (additionalRequestQuantity ?? 0);
    totals.set(dateKey, (totals.get(dateKey) ?? 0) + total);
  }

  return Array.from(totals, ([date, total]) => ({ date, total })).sort((a, b) =>
    b.date.localeCompare(a.date),
  );
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

// Only Multicam and Mono Insta 360 actually use an SD card — Mono iPhones
// record to internal storage and Powerbanks aren't a camera at all.
const NO_SD_CARD_CATEGORIES = new Set(["Powerbank", "Mono iPhones"]);

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
  /** One SD card per device unit (primary + additional) that needs one —
   * swapping just exchanges the same card, it doesn't add to this. */
  sdCardCount: number;
  /** Extra SD cards the logistics team has manually tagged for this
   * business (see ExtraSdCardEntry) — there's no form field for this. */
  extraSdCards: number;
  /** How many times they've submitted the Swapping Request form. */
  totalSwapRequests: number;
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
}

function newSummaryRow(businessName: string): BusinessDeviceSummaryRow {
  return {
    businessName,
    categoryCounts: Object.fromEntries(DEVICE_CATEGORIES.map((c) => [c, 0])),
    totalDeviceQty: 0,
    totalDispatchedQty: 0,
    additionalCategoryCounts: Object.fromEntries(DEVICE_CATEGORIES.map((c) => [c, 0])),
    totalAdditionalQty: 0,
    sdCardCount: 0,
    extraSdCards: 0,
    totalSwapRequests: 0,
  };
}

function aggregateBusinessRows(
  deviceRows: DeviceRowForSummary[],
  swapRows: SwapRowForSummary[],
  extraSdCardTotals: Map<string, number>,
): Map<string, BusinessDeviceSummaryRow> {
  const rows = new Map<string, BusinessDeviceSummaryRow>();

  function getRow(businessName: string): BusinessDeviceSummaryRow {
    let row = rows.get(businessName);
    if (!row) {
      row = newSummaryRow(businessName);
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
    if (!NO_SD_CARD_CATEGORIES.has(category)) row.sdCardCount += quantity;

    // Dispatching a request ships everything on it — the primary quantity
    // and any additional-request units together.
    if (status === "DISPATCHED") row.totalDispatchedQty += quantity;

    if (additionalRequestDeviceType && additionalRequestQuantity) {
      const additionalCategory = categorize(additionalRequestDeviceType);
      row.additionalCategoryCounts[additionalCategory] += additionalRequestQuantity;
      row.totalAdditionalQty += additionalRequestQuantity;
      if (!NO_SD_CARD_CATEGORIES.has(additionalCategory)) row.sdCardCount += additionalRequestQuantity;
      if (status === "DISPATCHED") row.totalDispatchedQty += additionalRequestQuantity;
    }
  }

  for (const { businessName } of swapRows) {
    getRow(businessName).totalSwapRequests += 1;
  }

  for (const [businessName, extra] of extraSdCardTotals) {
    getRow(businessName).extraSdCards += extra;
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

/** Extra SD cards tagged per business, summed across every tagging event. */
async function getExtraSdCardTotals(businessNames?: string[]): Promise<Map<string, number>> {
  const entries = await prisma.extraSdCardEntry.findMany({
    where: businessNames ? { businessName: { in: businessNames } } : undefined,
    select: { businessName: true, quantity: true },
  });
  const totals = new Map<string, number>();
  for (const { businessName, quantity } of entries) {
    totals.set(businessName, (totals.get(businessName) ?? 0) + quantity);
  }
  return totals;
}

/** Per-business breakdown of everything ever requested — device quantities
 * by category, SD card demand, and swap activity — across all requests
 * regardless of status (this counts total demand, not just what's been
 * dispatched). Deleted businesses are excluded — see
 * getTrashedBusinessSummary. */
export async function getBusinessDeviceSummary(
  businessType?: BusinessType,
): Promise<BusinessDeviceSummaryRow[]> {
  const visibleFilter = excludeBusinessNames(await getExcludedBusinessNames());

  const [deviceRows, swapRows] = await Promise.all([
    prisma.deviceRequest.findMany({
      where: {
        ...(businessType ? { businessType } : {}),
        ...(visibleFilter ? { businessName: visibleFilter } : {}),
      },
      select: SUMMARY_SELECT,
    }),
    prisma.swappingRequest.findMany({
      where: {
        ...(businessType ? { businessType } : {}),
        ...(visibleFilter ? { businessName: visibleFilter } : {}),
      },
      select: { businessName: true },
    }),
  ]);

  const businessNames = [...new Set([...deviceRows, ...swapRows].map((r) => r.businessName))];
  const extraSdCardTotals = await getExtraSdCardTotals(businessNames);

  const rows = aggregateBusinessRows(deviceRows, swapRows, extraSdCardTotals);
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

  const [deviceRows, swapRows, extraSdCardTotals] = await Promise.all([
    prisma.deviceRequest.findMany({
      where: { businessName: { in: deletedNames } },
      select: SUMMARY_SELECT,
    }),
    prisma.swappingRequest.findMany({
      where: { businessName: { in: deletedNames } },
      select: { businessName: true },
    }),
    getExtraSdCardTotals(deletedNames),
  ]);

  const rows = aggregateBusinessRows(deviceRows, swapRows, extraSdCardTotals);

  // A business can be in Trash with no requests under its exact name
  // spelling (e.g. deleted preemptively) — still show it.
  for (const name of deletedNames) {
    if (!rows.has(name)) rows.set(name, newSummaryRow(name));
  }

  return Array.from(rows.values())
    .map((row) => {
      const info = deletedInfo.get(row.businessName)!;
      return { ...row, deletedBy: info.deletedBy, deletedAt: info.deletedAt };
    })
    .sort((a, b) => b.deletedAt.getTime() - a.deletedAt.getTime());
}

/** Same per-business breakdown, for businesses whose most recent Device
 * Request is a Pull-out — auto-detected, not manually tagged. These are
 * hidden from Device Request, Swapping Request, and Summary (same as
 * Trash), and only show up here, unless also in Trash (Trash wins). */
export async function getPulledOutBusinessSummary(query?: string): Promise<BusinessDeviceSummaryRow[]> {
  const [deletedNames, statuses] = await Promise.all([
    getDeletedBusinessNames(),
    getBusinessLifecycleStatuses(),
  ]);
  const deletedSet = new Set(deletedNames);
  const q = query?.trim().toLowerCase();

  const pulledOutNames = [...statuses.entries()]
    .filter(([name, status]) => status === "PULLED_OUT" && !deletedSet.has(name))
    .map(([name]) => name)
    .filter((name) => !q || name.toLowerCase().includes(q));

  if (pulledOutNames.length === 0) return [];

  const [deviceRows, swapRows, extraSdCardTotals] = await Promise.all([
    prisma.deviceRequest.findMany({
      where: { businessName: { in: pulledOutNames } },
      select: SUMMARY_SELECT,
    }),
    prisma.swappingRequest.findMany({
      where: { businessName: { in: pulledOutNames } },
      select: { businessName: true },
    }),
    getExtraSdCardTotals(pulledOutNames),
  ]);

  const rows = aggregateBusinessRows(deviceRows, swapRows, extraSdCardTotals);
  for (const name of pulledOutNames) {
    if (!rows.has(name)) rows.set(name, newSummaryRow(name));
  }

  return Array.from(rows.values()).sort((a, b) => a.businessName.localeCompare(b.businessName));
}
