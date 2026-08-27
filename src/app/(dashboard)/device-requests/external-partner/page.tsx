import { listDeviceRequests, listDeviceRequestSdrNames, listDeviceRequestDeviceTypes } from "@/lib/data";
import { buildFilterQueryString } from "@/lib/filter-query";
import DeviceRequestsTable from "@/components/DeviceRequestsTable";
import SyncButton from "@/components/SyncButton";
import RequestFilters from "@/components/RequestFilters";
import ExportCsvLink from "@/components/ExportCsvLink";

export default async function DeviceRequestsExternalPartnerPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sdr?: string; device?: string; from?: string; to?: string }>;
}) {
  const { q, sdr, device, from, to } = await searchParams;
  const [requests, sdrOptions, deviceOptions] = await Promise.all([
    listDeviceRequests({
      businessType: "EXTERNAL_PARTNER",
      query: q,
      sdrName: sdr,
      deviceType: device,
      dateFrom: from,
      dateTo: to,
    }),
    listDeviceRequestSdrNames(),
    listDeviceRequestDeviceTypes(),
  ]);

  const exportHref = `/api/export/device-requests${buildFilterQueryString({
    q,
    sdr,
    device,
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
        dateFrom={from}
        dateTo={to}
        sdrOptions={sdrOptions}
        deviceOptions={deviceOptions}
        basePath="/device-requests/external-partner"
      />

      <DeviceRequestsTable requests={requests} />
    </div>
  );
}
