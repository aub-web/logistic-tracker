"use client";

import { useState, useTransition } from "react";
import { runSync } from "@/lib/actions/request-actions";

export default function SyncButton() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  return (
    <div className="flex items-center gap-3">
      {message && (
        <span className={`text-xs ${isError ? "text-red-600" : "text-zinc-500"}`}>
          {message}
        </span>
      )}
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            setMessage(null);
            try {
              const result = await runSync();
              const totalNew = result.deviceCreated + result.swappingCreated;
              const totalUpdated = result.deviceUpdated + result.swappingUpdated;
              setIsError(false);
              if (totalNew === 0 && totalUpdated === 0) {
                setMessage("Up to date — no new submissions.");
              } else {
                const parts = [];
                if (totalNew > 0) {
                  parts.push(
                    `${result.deviceCreated} new device, ${result.swappingCreated} new swapping request${
                      totalNew === 1 ? "" : "s"
                    }`,
                  );
                }
                if (totalUpdated > 0) {
                  parts.push(`${totalUpdated} marked Completed on the Sheet`);
                }
                setMessage(`Synced — ${parts.join("; ")}.`);
              }
            } catch {
              setIsError(true);
              setMessage("Sync failed — check the Google Sheets env vars.");
            }
          })
        }
        className="rounded-lg bg-[#14293D] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#0e1e2c] disabled:opacity-50"
      >
        {isPending ? "Syncing…" : "Sync from Google Forms"}
      </button>
    </div>
  );
}
