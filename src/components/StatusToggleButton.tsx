"use client";

import { useTransition } from "react";
import type { RequestStatus } from "@/generated/prisma/enums";

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
    <div
      className={`inline-flex flex-wrap overflow-hidden rounded-full border border-zinc-200 transition ${
        isPending ? "opacity-50" : ""
      }`}
    >
      <button
        type="button"
        disabled={isPending}
        onClick={() => choose("NEW")}
        aria-pressed={status === "NEW"}
        className={`px-2.5 py-1 text-xs font-semibold transition ${
          status === "NEW"
            ? "bg-zinc-200 text-zinc-800"
            : "bg-white text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600"
        }`}
      >
        New
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => choose("IN_PROGRESS")}
        aria-pressed={status === "IN_PROGRESS"}
        className={`border-l border-zinc-200 px-2.5 py-1 text-xs font-semibold transition ${
          status === "IN_PROGRESS"
            ? "bg-amber-100 text-amber-800"
            : "bg-white text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600"
        }`}
      >
        In Progress
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => choose("DISPATCHED")}
        aria-pressed={status === "DISPATCHED"}
        className={`border-l border-zinc-200 px-2.5 py-1 text-xs font-semibold transition ${
          status === "DISPATCHED"
            ? "bg-emerald-100 text-emerald-800"
            : "bg-white text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600"
        }`}
      >
        Dispatched
      </button>
    </div>
  );
}
