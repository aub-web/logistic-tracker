import { getTrashedBusinessSummary, getBusinessLifecycleStatuses } from "@/lib/data";
import TrashBusinessTable from "@/components/TrashBusinessTable";
import ExportCsvLink from "@/components/ExportCsvLink";

export default async function TrashPage() {
  const [rows, statuses] = await Promise.all([
    getTrashedBusinessSummary(),
    getBusinessLifecycleStatuses(),
  ]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Trash</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Deleted businesses. Their requests aren&rsquo;t gone — just hidden everywhere
            else until restored.
          </p>
        </div>
        <ExportCsvLink href="/api/export/trash" />
      </div>

      <TrashBusinessTable rows={rows} statuses={statuses} />
    </div>
  );
}
