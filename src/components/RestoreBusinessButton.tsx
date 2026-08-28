"use client";

import { useTransition } from "react";
import { restoreBusiness } from "@/lib/actions/business-actions";

export default function RestoreBusinessButton({ businessName }: { businessName: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => restoreBusiness(businessName))}
      className="rounded-lg border border-emerald-200 px-2.5 py-1 text-xs font-medium text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
    >
      {isPending ? "Restoring…" : "Restore"}
    </button>
  );
}
