import type { BusinessDeviceSummaryRow } from "@/lib/data";

export default function BusinessSummaryTable({
  rows,
  categories,
}: {
  rows: BusinessDeviceSummaryRow[];
  categories: string[];
}) {
  return (
    <div className="mt-4 max-h-[70vh] overflow-auto rounded-xl border border-zinc-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="sticky top-0 z-10 border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-4 py-3 font-medium">Business Name</th>
            {categories.map((category) => (
              <th key={category} className="px-4 py-3 text-right font-medium">
                {category}
              </th>
            ))}
            <th className="px-4 py-3 text-right font-medium">Total Device Qty</th>
            <th className="px-4 py-3 text-right font-medium">Device Requests</th>
            <th className="px-4 py-3 text-right font-medium">SD Cards</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {rows.length === 0 && (
            <tr>
              <td
                colSpan={categories.length + 4}
                className="px-4 py-8 text-center text-sm text-zinc-500"
              >
                No requests yet.
              </td>
            </tr>
          )}
          {rows.map((row) => (
            <tr key={row.businessName}>
              <td className="px-4 py-3 font-medium text-zinc-900">{row.businessName}</td>
              {categories.map((category) => (
                <td key={category} className="px-4 py-3 text-right text-zinc-600">
                  {row.categoryCounts[category] || "—"}
                </td>
              ))}
              <td className="px-4 py-3 text-right font-medium text-zinc-900">
                {row.totalDeviceQty}
              </td>
              <td className="px-4 py-3 text-right text-zinc-600">{row.totalDeviceRequests}</td>
              <td className="px-4 py-3 text-right text-zinc-600">{row.totalSdCards || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
