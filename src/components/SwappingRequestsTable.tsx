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

export default function SwappingRequestsTable({
  requests,
  statuses,
}: {
  requests: SwappingRequestModel[];
  statuses: Map<string, BusinessLifecycleStatus>;
}) {
  return (
    <div className="mt-4 max-h-[70vh] overflow-auto rounded-xl border border-zinc-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="sticky top-0 z-10 border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-4 py-3 font-medium">Req. ID</th>
            <th className="px-4 py-3 font-medium">Submitted</th>
            <th className="px-4 py-3 font-medium">Business</th>
            <th className="px-4 py-3 font-medium">Contact</th>
            <th className="px-4 py-3 font-medium">Address</th>
            <th className="px-4 py-3 font-medium">SD Cards</th>
            <th className="px-4 py-3 font-medium">SDR / SS</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Updated By</th>
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
              <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-zinc-500">
                {r.requestId}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-zinc-600">
                {r.submittedAt.toLocaleString("en-PH", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </td>
              <td className="px-4 py-3">
                <div className="font-medium text-zinc-900">{r.businessName}</div>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500">
                  {BUSINESS_TYPE_LABEL[r.businessType] ?? r.businessType}
                  <BusinessStatusBadge status={statuses.get(r.businessName)} />
                </div>
              </td>
              <td className="px-4 py-3 text-zinc-600">
                <div>{r.contactPerson}</div>
                <div className="text-xs text-zinc-500">{r.contactNumber}</div>
              </td>
              <td className="max-w-xs px-4 py-3 text-zinc-600">{r.businessAddress}</td>
              <td className="px-4 py-3 text-zinc-600">{r.sdCardCount}</td>
              <td className="px-4 py-3 text-zinc-600">
                <div>{r.sdrName}</div>
                {r.ssName && <div className="text-xs text-zinc-500">{r.ssName}</div>}
              </td>
              <td className="px-4 py-3">
                <StatusToggleButton id={r.id} status={r.status} action={setSwappingRequestStatus} />
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-xs text-zinc-500">
                {r.lastChangedBy ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
