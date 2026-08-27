import type { BusinessDeviceSummaryRow } from "@/lib/data";

export default function BusinessSummaryTable({ rows }: { rows: BusinessDeviceSummaryRow[] }) {
  return (
    <div className="mt-4 max-h-[70vh] overflow-auto rounded-xl border border-zinc-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="sticky top-0 z-10 border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-4 py-3 font-medium">Business Name</th>
            <th className="px-4 py-3 font-medium">Device Types</th>
            <th className="px-4 py-3 text-right font-medium">Total Device Qty</th>
            <th className="px-4 py-3 text-right font-medium">Device Requests</th>
            <th className="px-4 py-3 text-right font-medium">SD Cards</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-sm text-zinc-500">
                No requests yet.
              </td>
            </tr>
          )}
          {rows.map((row) => {
            // Only the device types this business actually requested —
            // no columns full of dashes for types it's never touched.
            const deviceTypes = Object.entries(row.categoryCounts).filter(([, count]) => count > 0);
            return (
              <tr key={row.businessName}>
                <td className="px-4 py-3 font-medium text-zinc-900">{row.businessName}</td>
                <td className="px-4 py-3 text-zinc-600">
                  {deviceTypes.length === 0 ? (
                    "—"
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {deviceTypes.map(([category, count]) => (
                        <span
                          key={category}
                          className="whitespace-nowrap rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700"
                        >
                          {category}: {count}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-right font-medium text-zinc-900">
                  {row.totalDeviceQty}
                </td>
                <td className="px-4 py-3 text-right text-zinc-600">{row.totalDeviceRequests}</td>
                <td className="px-4 py-3 text-right text-zinc-600">{row.totalSdCards || "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
