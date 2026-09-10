import {
  getDeployedDeviceSummary,
  getBusinessDeviceSummary,
  getBusinessLifecycleStatuses,
  getDailyDispatchedTotals,
  getLatestInventoryImport,
} from "@/lib/data";
import { buildFilterQueryString } from "@/lib/filter-query";
import type { BusinessType } from "@/generated/prisma/enums";
import BusinessSummaryTable from "@/components/BusinessSummaryTable";
import DailyDispatchedTable from "@/components/DailyDispatchedTable";
import DateRangeFilter from "@/components/DateRangeFilter";
import BusinessTypeFilter from "@/components/BusinessTypeFilter";
import ExportCsvLink from "@/components/ExportCsvLink";
import InventoryImportForm from "@/components/InventoryImportForm";
import InventoryTallyTable from "@/components/InventoryTallyTable";
import AvailableUnitsCards from "@/components/AvailableUnitsCards";

function parseBusinessType(value?: string): BusinessType | undefined {
  return value === "DIRECT_BUSINESS" || value === "EXTERNAL_PARTNER" ? value : undefined;
}

const BUSINESS_TYPE_LABEL: Record<string, string> = {
  DIRECT_BUSINESS: "Direct Business",
  EXTERNAL_PARTNER: "External Partner",
};

export default async function SummaryContent({
  dispatchedFrom,
  dispatchedTo,
  deployedBusinessType,
}: {
  dispatchedFrom?: string;
  dispatchedTo?: string;
  deployedBusinessType?: string;
}) {
  const businessTypeFilter = parseBusinessType(deployedBusinessType);

  const [
    { categories, totalDeployed },
    byBusinessTypeSummary,
    businessRows,
    statuses,
    dailyDispatched,
    inventory,
  ] = await Promise.all([
    getDeployedDeviceSummary(),
    getDeployedDeviceSummary(businessTypeFilter),
    getBusinessDeviceSummary(),
    getBusinessLifecycleStatuses(),
    getDailyDispatchedTotals(undefined, dispatchedFrom, dispatchedTo),
    getLatestInventoryImport(),
  ]);

  const dailyExportHref = `/api/export/daily-dispatched${buildFilterQueryString({
    from: dispatchedFrom,
    to: dispatchedTo,
  })}`;

  return (
    <div>
      <h1 className="text-xl font-semibold text-zinc-900">Deployed Devices Summary</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Total devices marked Dispatched, grouped by device type.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {categories.map((c) => (
          <div key={c.category} className="rounded-xl border border-zinc-200 bg-white p-5">
            <p className="text-sm font-medium text-zinc-500">{c.category}</p>
            <p className="mt-2 text-3xl font-semibold text-zinc-900">{c.count}</p>
          </div>
        ))}
        <div className="rounded-xl border border-[#14293D]/20 bg-[#14293D]/5 p-5">
          <p className="text-sm font-medium text-[#14293D]">Total Deployed</p>
          <p className="mt-2 text-3xl font-semibold text-[#14293D]">{totalDeployed}</p>
        </div>
      </div>

      <AvailableUnitsCards inventory={inventory} />

      <div className="mt-10">
        <h2 className="text-lg font-semibold text-zinc-900">Inventory Tally</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Import how many units are available right now (CSV with a device type and quantity
          column) — added to Total Deployed above, that&rsquo;s the total unit count.
        </p>
      </div>

      <div className="mt-4">
        <InventoryImportForm />
      </div>

      <InventoryTallyTable inventory={inventory} />

      <div className="mt-10">
        <h2 className="text-lg font-semibold text-zinc-900">Deployed by Business Type</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Check how many devices were deployed to Direct Business vs. External Partner accounts.
        </p>
      </div>

      <BusinessTypeFilter businessType={deployedBusinessType} basePath="/summary" />

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {byBusinessTypeSummary.categories.map((c) => (
          <div key={c.category} className="rounded-xl border border-zinc-200 bg-white p-5">
            <p className="text-sm font-medium text-zinc-500">{c.category}</p>
            <p className="mt-2 text-3xl font-semibold text-zinc-900">{c.count}</p>
          </div>
        ))}
        <div className="rounded-xl border border-[#14293D]/20 bg-[#14293D]/5 p-5">
          <p className="text-sm font-medium text-[#14293D]">
            Total Deployed
            {businessTypeFilter && ` — ${BUSINESS_TYPE_LABEL[businessTypeFilter]}`}
          </p>
          <p className="mt-2 text-3xl font-semibold text-[#14293D]">
            {byBusinessTypeSummary.totalDeployed}
          </p>
        </div>
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">Total Dispatched — By Day</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Every device dispatched, any request type, grouped by the day it was marked
            Dispatched.
          </p>
        </div>
        <ExportCsvLink href={dailyExportHref} />
      </div>

      <DateRangeFilter
        fromName="dispatchedFrom"
        toName="dispatchedTo"
        dateFrom={dispatchedFrom}
        dateTo={dispatchedTo}
        basePath="/summary"
      />

      <DailyDispatchedTable rows={dailyDispatched} />

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">By Business</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Every request ever submitted (any status), broken down by device type per business.
          </p>
        </div>
        <ExportCsvLink href="/api/export/summary" />
      </div>

      <BusinessSummaryTable rows={businessRows} statuses={statuses} />
    </div>
  );
}
