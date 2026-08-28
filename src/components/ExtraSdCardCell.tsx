"use client";

import { useState, useTransition } from "react";
import { addExtraSdCards } from "@/lib/actions/business-actions";

export default function ExtraSdCardCell({
  businessName,
  total,
}: {
  businessName: string;
  total: number;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [isPending, startTransition] = useTransition();

  function submit() {
    const qty = parseInt(value, 10);
    if (!Number.isFinite(qty) || qty <= 0) return;
    startTransition(async () => {
      await addExtraSdCards(businessName, qty);
      setEditing(false);
      setValue("");
    });
  }

  if (!editing) {
    return (
      <div className="flex items-center justify-end gap-2">
        <span className={total > 0 ? "font-medium text-zinc-900" : "text-zinc-400"}>
          {total || "—"}
        </span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-md border border-zinc-300 px-1.5 py-0.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50"
        >
          + Add
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <input
        type="number"
        min={1}
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="Qty"
        className="w-16 rounded-md border border-zinc-300 px-1.5 py-1 text-right text-xs focus:border-zinc-900 focus:outline-none"
      />
      <button
        type="button"
        disabled={isPending}
        onClick={submit}
        className="rounded-md bg-[#14293D] px-2 py-1 text-xs font-medium text-white transition hover:bg-[#0e1e2c] disabled:opacity-50"
      >
        {isPending ? "…" : "Save"}
      </button>
      <button
        type="button"
        onClick={() => {
          setEditing(false);
          setValue("");
        }}
        className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50"
      >
        Cancel
      </button>
    </div>
  );
}
