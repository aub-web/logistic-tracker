import type { InventoryImportSummary } from "@/lib/data";

export default function InventoryTallyTable({
  inventory,
}: {
  inventory: InventoryImportSummary | null;
}) {
  if (!inventory) {
    return (
      <div className="mt-4 rounded-xl border border-dashed border-zinc-300 bg-white px-4 py-6 text-center text-sm text-zinc-500">
        No inventory imported yet — upload a physical count above to tally it against Total Deployed.
      </div>
    );
  }

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-4 py-3 font-medium">Category</th>
            <th className="px-4 py-3 text-right font-medium">System (Deployed)</th>
            <th className="px-4 py-3 text-right font-medium">Physical Count</th>
            <th className="px-4 py-3 text-right font-medium">Variance</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {inventory.rows.map((row) => (
            <tr key={row.category}>
              <td className="px-4 py-3 font-medium text-zinc-900">{row.category}</td>
              <td className="px-4 py-3 text-right text-zinc-600">{row.systemCount}</td>
              <td className="px-4 py-3 text-right text-zinc-600">
                {row.physicalCount === null ? "—" : row.physicalCount}
              </td>
              <td
                className={`px-4 py-3 text-right font-semibold ${
                  row.variance === null
                    ? "text-zinc-400"
                    : row.variance === 0
                      ? "text-emerald-600"
                      : "text-rose-600"
                }`}
              >
                {row.variance === null
                  ? "—"
                  : row.variance === 0
                    ? "Tallied"
                    : row.variance > 0
                      ? `+${row.variance}`
                      : row.variance}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-zinc-100 px-4 py-2 text-xs text-zinc-500">
        Last imported by <span className="font-medium text-zinc-700">{inventory.importedBy}</span> on{" "}
        {inventory.importedAt.toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })}
      </p>
    </div>
  );
}
