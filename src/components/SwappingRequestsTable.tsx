import { setSwappingRequestStatus } from "@/lib/actions/request-actions";
import StatusToggleButton from "@/components/StatusToggleButton";
import BusinessStatusBadge from "@/components/BusinessStatusBadge";
import type { SwappingRequestModel } from "@/generated/prisma/models";
import type { BusinessLifecycleStatus } from "@/lib/data";

const BUSINESS_TYPE_LABEL: Record<string, string> = {
  DIRECT_BUSINESS: "Direct Business",
  EXTERNAL_PARTNER: "External Partner",
  OUTBOUND: "Outbound",
};

// Percentage widths for a fixed-layout table — always sums to 100 so the
// table never grows wider than its container, no matter the content. Rows
// wrap and grow taller instead of forcing a horizontal scrollbar.
const COLUMN_WIDTHS = [
  7, // Req. ID
  10, // Submitted
  9, // Swapping Date
  13, // Business
  12, // Contact
  17, // Address
  6, // SD Cards
  10, // SDR / SS
  16, // Status
];

export default function SwappingRequestsTable({
  requests,
  statuses,
}: {
  requests: SwappingRequestModel[];
  statuses: Map<string, BusinessLifecycleStatus>;
}) {
  return (
    <div className="mt-4 max-h-[70vh] overflow-x-hidden overflow-y-auto rounded-xl border border-zinc-200 bg-white">
      <table className="w-full table-fixed text-left text-sm">
        <colgroup>
          {COLUMN_WIDTHS.map((w, i) => (
            <col key={i} style={{ width: `${w}%` }} />
          ))}
        </colgroup>
        <thead className="sticky top-0 z-10 border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-3 py-3 font-medium">Req. ID</th>
            <th className="px-3 py-3 font-medium">Submitted</th>
            <th className="px-3 py-3 font-medium">Swapping Date</th>
            <th className="px-3 py-3 font-medium">Business</th>
            <th className="px-3 py-3 font-medium">Contact</th>
            <th className="px-3 py-3 font-medium">Address</th>
            <th className="px-3 py-3 font-medium">SD Cards</th>
            <th className="px-3 py-3 font-medium">SDR / SS</th>
            <th className="px-3 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {requests.length === 0 && (
            <tr>
              <td colSpan={9} className="px-4 py-8 text-center text-sm text-zinc-500">
                No swapping requests found.
              </td>
            </tr>
          )}
          {requests.map((r) => (
            <tr key={r.id}>
              <td className="break-words px-3 py-3 font-mono text-xs text-zinc-500">
                {r.requestId}
              </td>
              <td className="break-words px-3 py-3 text-zinc-600">
                {r.submittedAt.toLocaleString("en-PH", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </td>
              <td className="break-words px-3 py-3 text-zinc-600">{r.swappingDate || "—"}</td>
              <td className="break-words px-3 py-3">
                <div className="font-medium text-zinc-900">{r.businessName}</div>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-zinc-500">
                  {BUSINESS_TYPE_LABEL[r.businessType] ?? r.businessType}
                  <BusinessStatusBadge status={statuses.get(r.businessName)} />
                </div>
              </td>
              <td className="break-words px-3 py-3 text-zinc-600">
                <div>{r.contactPerson}</div>
                <div className="text-xs text-zinc-500">{r.contactNumber}</div>
              </td>
              <td className="break-words px-3 py-3 text-zinc-600">{r.businessAddress}</td>
              <td className="break-words px-3 py-3 text-zinc-600">{r.sdCardCount}</td>
              <td className="break-words px-3 py-3 text-zinc-600">
                <div>{r.sdrName}</div>
                {r.ssName && <div className="text-xs text-zinc-500">{r.ssName}</div>}
              </td>
              <td className="break-words px-3 py-3">
                <StatusToggleButton id={r.id} status={r.status} action={setSwappingRequestStatus} />
                {r.dispatchedAt && (
                  <div className="mt-1 text-xs text-zinc-500">
                    {r.dispatchedAt.toLocaleString("en-PH", { dateStyle: "short", timeStyle: "short" })}
                    {r.lastChangedBy && ` · ${r.lastChangedBy}`}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
