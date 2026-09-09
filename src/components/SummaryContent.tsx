import {
  getDeployedDeviceSummary,
  getBusinessDeviceSummary,
  getBusinessLifecycleStatuses,
  getDailyDispatchedTotals,
  getLatestInventoryImport,
} from "@/lib/data";
import type { BusinessType } from "@/generated/prisma/enums";
import BusinessSummaryTable from "@/components/BusinessSummaryTable";
import DailyDispatchedTable from "@/components/DailyDispatchedTable";
import DateRangeFilter from "@/components/DateRangeFilter";
import ExportCsvLink from "@/components/ExportCsvLink";
import InventoryImportForm from "@/components/InventoryImportForm";
import InventoryTallyTable from "@/components/InventoryTallyTable";

export default async function SummaryContent({
  businessType,
  title,
  description,
  exportHref,
  dailyExportHref,
  basePath,
  dispatchedFrom,
  dispatchedTo,
}: {
  businessType?: BusinessType;
  title: string;
  description: string;
  exportHref: string;
  dailyExportHref: string;
  basePath: string;
  dispatchedFrom?: string;
  dispatchedTo?: string;
}) {
  const [{ categories, totalDeployed }, businessRows, statuses, dailyDispatched, inventory] =
    await Promise.all([
      getDeployedDeviceSummary(businessType),
      getBusinessDeviceSummary(businessType),
      getBusinessLifecycleStatuses(),
      getDailyDispatchedTotals(businessType, dispatchedFrom, dispatchedTo),
      businessType ? Promise.resolve(null) : getLatestInventoryImport(),
    ]);

  return (
    <div>
      <h1 className="text-xl font-semibold text-zinc-900">{title}</h1>
      <p className="mt-1 text-sm text-zinc-500">{description}</p>

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

      {!businessType && (
        <>
          <div className="mt-10">
            <h2 className="text-lg font-semibold text-zinc-900">Inventory Tally</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Import a physical count file (CSV with a device type and quantity column) to check it
              against Total Deployed above.
            </p>
          </div>

          <div className="mt-4">
            <InventoryImportForm />
          </div>

          <InventoryTallyTable inventory={inventory} />
        </>
      )}

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
        basePath={basePath}
      />

      <DailyDispatchedTable rows={dailyDispatched} />

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">By Business</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Every request ever submitted (any status), broken down by device type per business.
          </p>
        </div>
        <ExportCsvLink href={exportHref} />
      </div>

      <BusinessSummaryTable rows={businessRows} statuses={statuses} />
    </div>
  );
}
