import { setDeviceRequestStatus } from "@/lib/actions/request-actions";
import StatusToggleButton from "@/components/StatusToggleButton";
import BusinessStatusBadge from "@/components/BusinessStatusBadge";
import type { DeviceRequestModel } from "@/generated/prisma/models";
import type { BusinessLifecycleStatus } from "@/lib/data";

const REQUEST_TYPE_LABEL: Record<string, string> = {
  DROP_OFF: "Drop-off",
  REPLACEMENT: "Replacement",
  PULL_OUT: "Pull-out",
};

const BUSINESS_TYPE_LABEL: Record<string, string> = {
  DIRECT_BUSINESS: "Direct Business",
  EXTERNAL_PARTNER: "External Partner",
  OUTBOUND: "Outbound",
};

// Percentage widths for a fixed-layout table — always sums to 100 so the
// table never grows wider than its container, no matter the content. Rows
// wrap and grow taller instead of forcing a horizontal scrollbar.
const COLUMN_WIDTHS = [
  4, // Req. ID
  7, // Submitted
  6, // Request Date
  5, // Type
  9, // Business
  8, // Contact
  11, // Address
  8, // Delivery
  7, // Device
  3, // Qty
  6, // SDR / SS
  10, // Replacement Issue
  16, // Status
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">{label}</p>
      <div className="mt-0.5 text-zinc-700">{children}</div>
    </div>
  );
}

function AttributionLine({ r }: { r: DeviceRequestModel }) {
  return r.lastChangedBy ? (
    <div className="mt-1 text-xs text-zinc-500">
      {(r.dispatchedAt ?? r.updatedAt).toLocaleString("en-PH", {
        dateStyle: "short",
        timeStyle: "short",
      })}{" "}
      · {r.lastChangedBy}
    </div>
  ) : (
    <div className="mt-1 text-xs text-zinc-400">Not yet touched</div>
  );
}

export default function DeviceRequestsTable({
  requests,
  statuses,
}: {
  requests: DeviceRequestModel[];
  statuses: Map<string, BusinessLifecycleStatus>;
}) {
  if (requests.length === 0) {
    return (
      <div className="mt-4 rounded-xl border border-zinc-200 bg-white px-4 py-8 text-center text-sm text-zinc-500">
        No device requests found.
      </div>
    );
  }

  return (
    <>
      {/* Mobile: one card per request, everything stacked and readable. */}
      <div className="mt-4 space-y-3 sm:hidden">
        {requests.map((r) => (
          <div key={r.id} className="rounded-xl border border-zinc-200 bg-white p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-mono text-xs text-zinc-500">{r.requestId}</p>
                <p className="mt-0.5 font-semibold text-zinc-900">{r.businessName}</p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-zinc-500">
                  {BUSINESS_TYPE_LABEL[r.businessType] ?? r.businessType}
                  <BusinessStatusBadge status={statuses.get(r.businessName)} />
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700">
                {REQUEST_TYPE_LABEL[r.requestType] ?? r.requestType}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
              <Field label="Submitted">
                {r.submittedAt.toLocaleString("en-PH", { dateStyle: "short", timeStyle: "short" })}
              </Field>
              <Field label="Request Date">{r.requestDate || "—"}</Field>
              <Field label="Device">{r.deviceType}</Field>
              <Field label="Qty">{r.quantity}</Field>
              <Field label="Contact">
                <div>{r.contactPerson}</div>
                <div className="text-xs text-zinc-500">{r.contactNumber}</div>
              </Field>
              <Field label="SDR / SS">
                <div>{r.sdrName}</div>
                {r.ssName && <div className="text-xs text-zinc-500">{r.ssName}</div>}
              </Field>
              <Field label="Delivery">{r.deliveryMode}</Field>
              <Field label="Address">{r.businessAddress}</Field>
              {r.replacementIssue && (
                <div className="col-span-2">
                  <Field label="Replacement Issue">{r.replacementIssue}</Field>
                </div>
              )}
            </div>

            <div className="mt-3 border-t border-zinc-100 pt-3">
              <StatusToggleButton id={r.id} status={r.status} action={setDeviceRequestStatus} />
              <AttributionLine r={r} />
            </div>
          </div>
        ))}
      </div>

      {/* Desktop / tablet: fixed-layout table, no horizontal scroll. */}
      <div className="mt-4 hidden max-h-[70vh] overflow-x-hidden overflow-y-auto rounded-xl border border-zinc-200 bg-white sm:block">
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
              <th className="px-3 py-3 font-medium">Request Date</th>
              <th className="px-3 py-3 font-medium">Type</th>
              <th className="px-3 py-3 font-medium">Business</th>
              <th className="px-3 py-3 font-medium">Contact</th>
              <th className="px-3 py-3 font-medium">Address</th>
              <th className="px-3 py-3 font-medium">Delivery</th>
              <th className="px-3 py-3 font-medium">Device</th>
              <th className="px-3 py-3 font-medium">Qty</th>
              <th className="px-3 py-3 font-medium">SDR / SS</th>
              <th className="px-3 py-3 font-medium">Replacement Issue</th>
              <th className="px-3 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
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
                <td className="break-words px-3 py-3 text-zinc-600">{r.requestDate || "—"}</td>
                <td className="break-words px-3 py-3 font-medium text-zinc-900">
                  {REQUEST_TYPE_LABEL[r.requestType] ?? r.requestType}
                </td>
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
                <td className="break-words px-3 py-3 text-zinc-600">{r.deliveryMode}</td>
                <td className="break-words px-3 py-3 text-zinc-600">{r.deviceType}</td>
                <td className="break-words px-3 py-3 text-zinc-600">{r.quantity}</td>
                <td className="break-words px-3 py-3 text-zinc-600">
                  <div>{r.sdrName}</div>
                  {r.ssName && <div className="text-xs text-zinc-500">{r.ssName}</div>}
                </td>
                <td className="break-words px-3 py-3 text-zinc-600">{r.replacementIssue || "—"}</td>
                <td className="break-words px-3 py-3">
                  <StatusToggleButton id={r.id} status={r.status} action={setDeviceRequestStatus} />
                  <AttributionLine r={r} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
