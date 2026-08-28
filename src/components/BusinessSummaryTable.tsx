import type { BusinessDeviceSummaryRow, BusinessLifecycleStatus } from "@/lib/data";
import DeviceBadges from "@/components/DeviceBadges";
import BusinessStatusBadge from "@/components/BusinessStatusBadge";
import DeleteBusinessButton from "@/components/DeleteBusinessButton";
import ExtraSdCardCell from "@/components/ExtraSdCardCell";

export default function BusinessSummaryTable({
  rows,
  statuses,
}: {
  rows: BusinessDeviceSummaryRow[];
  statuses: Map<string, BusinessLifecycleStatus>;
}) {
  return (
    <div className="mt-4 max-h-[70vh] overflow-auto rounded-xl border border-zinc-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="sticky top-0 z-10 border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-4 py-3 font-medium">Business Name</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Device Types</th>
            <th className="px-4 py-3 text-right font-medium">Device Request (Qty)</th>
            <th className="px-4 py-3 text-right font-medium">Total Dispatched</th>
            <th className="px-4 py-3 font-medium">Additional Request Device</th>
            <th className="px-4 py-3 text-right font-medium">SD Card</th>
            <th className="px-4 py-3 text-right font-medium">Total Extra SD Card</th>
            <th className="px-4 py-3 text-right font-medium">Total Swap Requests</th>
            <th className="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {rows.length === 0 && (
            <tr>
              <td colSpan={10} className="px-4 py-8 text-center text-sm text-zinc-500">
                No requests yet.
              </td>
            </tr>
          )}
          {rows.map((row) => (
            <tr key={row.businessName}>
              <td className="px-4 py-3 font-medium text-zinc-900">{row.businessName}</td>
              <td className="px-4 py-3">
                <BusinessStatusBadge status={statuses.get(row.businessName)} />
              </td>
              <td className="px-4 py-3 text-zinc-600">
                <DeviceBadges counts={row.categoryCounts} showQty={false} />
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
              <td className="px-4 py-3 text-right text-zinc-600">{row.sdCardCount || "—"}</td>
              <td className="px-4 py-3">
                <ExtraSdCardCell businessName={row.businessName} total={row.extraSdCards} />
              </td>
              <td className="px-4 py-3 text-right text-zinc-600">
                {row.totalSwapRequests || "—"}
              </td>
              <td className="px-4 py-3">
                <DeleteBusinessButton businessName={row.businessName} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
