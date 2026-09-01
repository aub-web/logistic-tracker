"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminName } from "@/lib/admin-auth";
import { syncDeviceRequests, syncSwappingRequests } from "@/lib/sync";
import type { RequestStatus } from "@/generated/prisma/enums";

const DEVICE_REQUEST_PATHS = [
  "/device-requests",
  "/device-requests/direct-business",
  "/device-requests/external-partner",
];

const SWAPPING_REQUEST_PATHS = [
  "/swapping-requests",
  "/swapping-requests/direct-business",
  "/swapping-requests/external-partner",
];

const SUMMARY_PATHS = [
  "/summary",
  "/summary/direct-business",
  "/summary/external-partner",
  "/pulled-out",
];

export async function setDeviceRequestStatus(
  id: string,
  status: RequestStatus,
): Promise<void> {
  const changedBy = await requireAdminName();

  await prisma.deviceRequest.update({
    where: { id },
    data: {
      status,
      dispatchedAt: status === "DISPATCHED" ? new Date() : null,
      lastChangedBy: changedBy,
    },
  });

  for (const path of DEVICE_REQUEST_PATHS) revalidatePath(path);
  for (const path of SUMMARY_PATHS) revalidatePath(path);
}

export async function setSwappingRequestStatus(
  id: string,
  status: RequestStatus,
): Promise<void> {
  const changedBy = await requireAdminName();

  await prisma.swappingRequest.update({
    where: { id },
    data: {
      status,
      dispatchedAt: status === "DISPATCHED" ? new Date() : null,
      lastChangedBy: changedBy,
    },
  });

  for (const path of SWAPPING_REQUEST_PATHS) revalidatePath(path);
  for (const path of SUMMARY_PATHS) revalidatePath(path);
}

export async function runSync(): Promise<{
  deviceCreated: number;
  swappingCreated: number;
  deviceUpdated: number;
  swappingUpdated: number;
}> {
  await requireAdminName();

  const [device, swapping] = await Promise.all([
    syncDeviceRequests(),
    syncSwappingRequests(),
  ]);

  for (const path of [...DEVICE_REQUEST_PATHS, ...SWAPPING_REQUEST_PATHS, ...SUMMARY_PATHS]) {
    revalidatePath(path);
  }

  return {
    deviceCreated: device.created,
    swappingCreated: swapping.created,
    deviceUpdated: device.updated,
    swappingUpdated: swapping.updated,
  };
}
