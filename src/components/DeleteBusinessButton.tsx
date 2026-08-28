"use client";

import { useTransition } from "react";
import { deleteBusiness } from "@/lib/actions/business-actions";

export default function DeleteBusinessButton({ businessName }: { businessName: string }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (
      !window.confirm(
        `Move "${businessName}" to Trash? It'll disappear from Device Request, Swapping Request, and Summary until someone restores it — nothing is deleted.`,
      )
    ) {
      return;
    }
    startTransition(() => deleteBusiness(businessName));
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={handleClick}
      className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50"
    >
      {isPending ? "Moving…" : "Delete"}
    </button>
  );
}
