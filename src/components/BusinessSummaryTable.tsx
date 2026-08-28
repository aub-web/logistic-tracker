import type { BusinessDeviceSummaryRow } from "@/lib/data";

// Only the categories a business actually has counts for — no columns full
// of dashes for device types it's never touched.
function DeviceBadges({ counts }: { counts: Record<string, number> }) {
  const entries = Object.entries(counts).filter(([, count]) => count > 0);
  if (entries.length === 0) return <span className="text-zinc-400">—</span>;

  return (
    <div className="flex flex-wrap gap-1.5">
      {entries.map(([category, count]) => (
        <span
          key={category}
          className="whitespace-nowrap rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700"
        >
          {category}: {count}
        </span>
      ))}
    </div>
  );
}

export default function BusinessSummaryTable({ rows }: { rows: BusinessDeviceSummaryRow[] }) {
  return (
    <div className="mt-4 max-h-[70vh] overflow-auto rounded-xl border border-zinc-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="sticky top-0 z-10 border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-4 py-3 font-medium">Business Name</th>
            <th className="px-4 py-3 font-medium">Device Types</th>
            <th className="px-4 py-3 text-right font-medium">Device Request (Qty)</th>
            <th className="px-4 py-3 text-right font-medium">Total Dispatched</th>
            <th className="px-4 py-3 font-medium">Additional Request Device</th>
            <th className="px-4 py-3 text-right font-medium">SD Cards (Swapped / Expected)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {rows.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-sm text-zinc-500">
                No requests yet.
              </td>
            </tr>
          )}
          {rows.map((row) => (
            <tr key={row.businessName}>
              <td className="px-4 py-3 font-medium text-zinc-900">{row.businessName}</td>
              <td className="px-4 py-3 text-zinc-600">
                <DeviceBadges counts={row.categoryCounts} />
              </td>
              <td className="px-4 py-3 text-right font-medium text-zinc-900">
                {row.totalDeviceQty}
              </td>
              <td className="px-4 py-3 text-right text-emerald-700">
                {row.totalDispatchedQty || "—"}
              </td>
              <td className="px-4 py-3 text-zinc-600">
                <DeviceBadges counts={row.additionalCategoryCounts} />
              </td>
              <td className="px-4 py-3 text-right text-zinc-600">
                {row.expectedSdCards === 0 ? (
                  "—"
                ) : (
                  <>
                    <span
                      className={
                        row.totalSdCards < row.expectedSdCards
                          ? "font-medium text-amber-700"
                          : "text-zinc-600"
                      }
                    >
                      {row.totalSdCards}
                    </span>
                    <span className="text-zinc-400"> / {row.expectedSdCards}</span>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
