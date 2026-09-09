"use client";

import { useRef, useState, useTransition } from "react";
import { importInventory } from "@/lib/actions/inventory-actions";

export default function InventoryImportForm() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      className="flex flex-wrap items-center gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(async () => {
          setMessage(null);
          try {
            const result = await importInventory(formData);
            setIsError(false);
            setMessage(
              result.skippedRows > 0
                ? `Imported ${result.categoriesImported} categories — ${result.skippedRows} row${
                    result.skippedRows === 1 ? "" : "s"
                  } skipped (no readable quantity).`
                : `Imported ${result.categoriesImported} categories.`,
            );
            formRef.current?.reset();
          } catch (err) {
            setIsError(true);
            setMessage(err instanceof Error ? err.message : "Import failed.");
          }
        });
      }}
    >
      <input
        type="file"
        name="file"
        accept=".csv,text/csv"
        required
        disabled={isPending}
        className="w-full max-w-xs text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-zinc-700 hover:file:bg-zinc-200"
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-[#14293D] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#0e1e2c] disabled:opacity-50"
      >
        {isPending ? "Importing…" : "Import Inventory"}
      </button>
      {message && (
        <span className={`text-xs ${isError ? "text-red-600" : "text-zinc-500"}`}>{message}</span>
      )}
    </form>
  );
}
