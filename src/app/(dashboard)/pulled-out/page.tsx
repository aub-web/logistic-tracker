import { getPulledOutBusinessSummary, getBusinessLifecycleStatuses } from "@/lib/data";
import BusinessSummaryTable from "@/components/BusinessSummaryTable";
import BusinessSearchBar from "@/components/BusinessSearchBar";
import ExportCsvLink from "@/components/ExportCsvLink";

export default async function PulledOutPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const [rows, statuses] = await Promise.all([
    getPulledOutBusinessSummary(q),
    getBusinessLifecycleStatuses(),
  ]);

  const exportHref = q ? `/api/export/pulled-out?q=${encodeURIComponent(q)}` : "/api/export/pulled-out";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Pulled Out</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Businesses whose most recent Device Request is a Pull-out — detected automatically,
            hidden from Device Request, Swapping Request, and Summary.
          </p>
        </div>
        <ExportCsvLink href={exportHref} />
      </div>

      <BusinessSearchBar query={q} basePath="/pulled-out" />

      <BusinessSummaryTable rows={rows} statuses={statuses} />
    </div>
  );
}
