import {
  listDeviceRequests,
  listDeviceRequestSdrNames,
  listDeviceRequestDeviceTypes,
  getBusinessLifecycleStatuses,
} from "@/lib/data";
import { buildFilterQueryString } from "@/lib/filter-query";
import DeviceRequestsTable from "@/components/DeviceRequestsTable";
import SyncButton from "@/components/SyncButton";
import RequestFilters from "@/components/RequestFilters";
import ExportCsvLink from "@/components/ExportCsvLink";
import type { DeviceRequestType } from "@/generated/prisma/enums";

function parseRequestType(value?: string): DeviceRequestType | undefined {
  return value === "DROP_OFF" || value === "REPLACEMENT" || value === "PULL_OUT"
    ? value
    : undefined;
}

export default async function DeviceRequestsExternalPartnerPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    sdr?: string;
    device?: string;
    type?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const { q, sdr, device, type, from, to } = await searchParams;
  const requestType = parseRequestType(type);
  const [requests, sdrOptions, deviceOptions, statuses] = await Promise.all([
    listDeviceRequests({
      businessType: "EXTERNAL_PARTNER",
      query: q,
      sdrName: sdr,
      deviceType: device,
      requestType,
      dateFrom: from,
      dateTo: to,
    }),
    listDeviceRequestSdrNames(),
    listDeviceRequestDeviceTypes(),
    getBusinessLifecycleStatuses(),
  ]);

  const exportHref = `/api/export/device-requests${buildFilterQueryString({
    q,
    sdr,
    device,
    type,
    from,
    to,
    businessType: "EXTERNAL_PARTNER",
  })}`;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">
            Device Requests — External Partner
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Requests from External Partner accounts.
          </p>
        </div>
        <div className="flex gap-2">
          <ExportCsvLink href={exportHref} />
          <SyncButton />
        </div>
      </div>

      <RequestFilters
        query={q}
        sdrName={sdr}
        deviceType={device}
        requestType={type}
        dateFrom={from}
        dateTo={to}
        sdrOptions={sdrOptions}
        deviceOptions={deviceOptions}
        showRequestType
        basePath="/device-requests/external-partner"
      />

      <DeviceRequestsTable requests={requests} statuses={statuses} />
    </div>
  );
}
