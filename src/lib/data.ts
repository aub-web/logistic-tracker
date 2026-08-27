import "server-only";
import { prisma } from "@/lib/prisma";
import type { BusinessType } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";

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

export function listDeviceRequests(businessType?: BusinessType, query?: string) {
  const q = query?.trim();
  return prisma.deviceRequest.findMany({
    where: {
      ...(businessType ? { businessType } : {}),
      ...(q ? deviceSearchFilter(q) : {}),
    },
    orderBy: { submittedAt: "desc" },
  });
}

export function listSwappingRequests(businessType?: BusinessType, query?: string) {
  const q = query?.trim();
  return prisma.swappingRequest.findMany({
    where: {
      ...(businessType ? { businessType } : {}),
      ...(q ? swappingSearchFilter(q) : {}),
    },
    orderBy: { submittedAt: "desc" },
  });
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
];

function categorize(deviceType: string): string {
  return DEVICE_CATEGORY_RULES.find((rule) => rule.test.test(deviceType))?.category ?? "Other";
}

/** Total dispatched (deployed) devices, grouped by device type category. */
export async function getDeployedDeviceSummary(): Promise<{
  categories: DeviceCategorySummary[];
  totalDeployed: number;
}> {
  const dispatched = await prisma.deviceRequest.findMany({
    where: { status: "DISPATCHED" },
    select: { deviceType: true, quantity: true },
  });

  const counts = new Map<string, number>(
    DEVICE_CATEGORY_RULES.map((rule) => [rule.category, 0]),
  );
  counts.set("Other", 0);

  for (const { deviceType, quantity } of dispatched) {
    const category = categorize(deviceType);
    counts.set(category, (counts.get(category) ?? 0) + quantity);
  }

  const categories = Array.from(counts, ([category, count]) => ({ category, count }));
  const totalDeployed = categories.reduce((sum, c) => sum + c.count, 0);

  return { categories, totalDeployed };
}
