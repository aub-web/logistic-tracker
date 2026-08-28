import { listSwappingRequests, listSwappingRequestSdrNames, getBusinessLifecycleStatuses } from "@/lib/data";
import { buildFilterQueryString } from "@/lib/filter-query";
import SwappingRequestsTable from "@/components/SwappingRequestsTable";
import SyncButton from "@/components/SyncButton";
import RequestFilters from "@/components/RequestFilters";
import ExportCsvLink from "@/components/ExportCsvLink";

export default async function SwappingRequestsExternalPartnerPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sdr?: string; from?: string; to?: string }>;
}) {
  const { q, sdr, from, to } = await searchParams;
  const [requests, sdrOptions, statuses] = await Promise.all([
    listSwappingRequests({
      businessType: "EXTERNAL_PARTNER",
      query: q,
      sdrName: sdr,
      dateFrom: from,
      dateTo: to,
    }),
    listSwappingRequestSdrNames(),
    getBusinessLifecycleStatuses(),
  ]);

  const exportHref = `/api/export/swapping-requests${buildFilterQueryString({
    q,
    sdr,
    from,
    to,
    businessType: "EXTERNAL_PARTNER",
  })}`;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">
            Swapping Requests — External Partner
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            SD card swap requests from External Partner accounts.
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
        dateFrom={from}
        dateTo={to}
        sdrOptions={sdrOptions}
        basePath="/swapping-requests/external-partner"
      />

      <SwappingRequestsTable requests={requests} statuses={statuses} />
    </div>
  );
}
