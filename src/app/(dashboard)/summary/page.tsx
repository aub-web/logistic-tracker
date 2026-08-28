import { getDeployedDeviceSummary, getBusinessDeviceSummary, getBusinessLifecycleStatuses } from "@/lib/data";
import BusinessSummaryTable from "@/components/BusinessSummaryTable";
import ExportCsvLink from "@/components/ExportCsvLink";

export default async function SummaryPage() {
  const [{ categories, totalDeployed }, businessRows, statuses] = await Promise.all([
    getDeployedDeviceSummary(),
    getBusinessDeviceSummary(),
    getBusinessLifecycleStatuses(),
  ]);

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
