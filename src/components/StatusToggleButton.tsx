"use client";

import { useTransition } from "react";
import type { RequestStatus } from "@/generated/prisma/enums";

const OPTIONS: { status: RequestStatus; label: string; active: string }[] = [
  { status: "NEW", label: "New", active: "bg-zinc-200 text-zinc-800 border-zinc-300" },
  { status: "IN_PROGRESS", label: "In Progress", active: "bg-amber-100 text-amber-800 border-amber-200" },
  { status: "DISPATCHED", label: "Dispatched", active: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { status: "CANCELLED", label: "Cancel", active: "bg-rose-100 text-rose-800 border-rose-200" },
];

export default function StatusToggleButton({
  id,
  status,
  action,
}: {
  id: string;
  status: RequestStatus;
  action: (id: string, status: RequestStatus) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();

  function choose(next: RequestStatus) {
    if (isPending || next === status) return;
    startTransition(() => action(id, next));
  }

  return (
    <div className={`grid grid-cols-2 gap-1 transition ${isPending ? "opacity-50" : ""}`}>
      {OPTIONS.map((opt) => (
        <button
          key={opt.status}
          type="button"
          disabled={isPending}
          onClick={() => choose(opt.status)}
          aria-pressed={status === opt.status}
          className={`rounded-md border px-2 py-1 text-xs font-semibold transition ${
            status === opt.status
              ? opt.active
              : "border-zinc-200 bg-white text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
