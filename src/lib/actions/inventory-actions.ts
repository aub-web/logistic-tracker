"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminName } from "@/lib/admin-auth";
import { parseInventoryImport } from "@/lib/inventory-import";

const MAX_FILE_BYTES = 2 * 1024 * 1024; // 2 MB — a category/quantity CSV is tiny

export interface ImportInventoryResult {
  categoriesImported: number;
  skippedRows: number;
}

/** Imports a physical inventory count file (CSV) so it can be tallied
 * against what the app computes as deployed on the Summary page. Each
 * import fully replaces the "current" count — it's a snapshot of a stock
 * take, not a running total — but prior batches stay in the table for
 * history. */
export async function importInventory(formData: FormData): Promise<ImportInventoryResult> {
  const importedBy = await requireAdminName();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Choose a file to import.");
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("That file is too large — export just the device type and quantity columns.");
  }

  const text = await file.text();
  const { counts, skippedRows } = parseInventoryImport(text);

  if (counts.size === 0) {
    throw new Error("No readable rows found in that file.");
  }

  await prisma.inventoryImportBatch.create({
    data: {
      importedBy,
      entries: {
        create: Array.from(counts, ([category, quantity]) => ({ category, quantity })),
      },
    },
  });

  revalidatePath("/summary");

  return { categoriesImported: counts.size, skippedRows };
}
