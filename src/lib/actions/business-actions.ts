"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminName } from "@/lib/admin-auth";

const PATHS_TO_REVALIDATE = [
  "/device-requests",
  "/device-requests/direct-business",
  "/device-requests/external-partner",
  "/swapping-requests",
  "/swapping-requests/direct-business",
  "/swapping-requests/external-partner",
  "/summary",
  "/trash",
];

function revalidateAll() {
  for (const path of PATHS_TO_REVALIDATE) revalidatePath(path);
}

/** Moves a business to Trash — hides it from every request table, filter,
 * and Summary until restored. Doesn't touch its underlying requests. */
export async function deleteBusiness(businessName: string): Promise<void> {
  const deletedBy = await requireAdminName();

  await prisma.business.upsert({
    where: { name: businessName },
    create: { name: businessName, deletedBy },
    update: { deletedAt: new Date(), deletedBy },
  });

  revalidateAll();
}

export async function restoreBusiness(businessName: string): Promise<void> {
  await requireAdminName();

  await prisma.business.deleteMany({ where: { name: businessName } });

  revalidateAll();
}

/** Tags extra SD cards handed out for a business beyond the normal
 * one-per-device allocation — there's no form field for this, so it's
 * recorded directly here. Each call adds a new dated entry rather than
 * overwriting a running total, so who tagged what stays auditable. */
export async function addExtraSdCards(businessName: string, quantity: number): Promise<void> {
  const taggedBy = await requireAdminName();

  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error("Quantity must be a positive whole number.");
  }

  await prisma.extraSdCardEntry.create({
    data: { businessName, quantity, taggedBy },
  });

  revalidateAll();
}
