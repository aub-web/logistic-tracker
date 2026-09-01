import type { DailyDispatchedRow } from "@/lib/data";

export default function DailyDispatchedTable({ rows }: { rows: DailyDispatchedRow[] }) {
  const grandTotal = rows.reduce((sum, r) => sum + r.total, 0);

  return (
    <div className="mt-4 max-h-[50vh] overflow-auto rounded-xl border border-zinc-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="sticky top-0 z-10 border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 text-right font-medium">Total Dispatched</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {rows.length === 0 && (
            <tr>
              <td colSpan={2} className="px-4 py-8 text-center text-sm text-zinc-500">
                No dispatches in this range.
              </td>
            </tr>
          )}
          {rows.map((row) => (
            <tr key={row.date}>
              <td className="px-4 py-3 font-medium text-zinc-900">
                {new Date(`${row.date}T00:00:00`).toLocaleDateString("en-PH", {
                  weekday: "short",
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </td>
              <td className="px-4 py-3 text-right text-zinc-600">{row.total}</td>
            </tr>
          ))}
        </tbody>
        {rows.length > 0 && (
          <tfoot className="sticky bottom-0 border-t border-zinc-200 bg-zinc-50">
            <tr>
              <td className="px-4 py-3 font-semibold text-zinc-900">Total</td>
              <td className="px-4 py-3 text-right font-semibold text-zinc-900">{grandTotal}</td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
