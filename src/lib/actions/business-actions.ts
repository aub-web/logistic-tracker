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
