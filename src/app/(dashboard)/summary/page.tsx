import SummaryContent from "@/components/SummaryContent";
import { buildFilterQueryString } from "@/lib/filter-query";

export default async function SummaryPage({
  searchParams,
}: {
  searchParams: Promise<{ dispatchedFrom?: string; dispatchedTo?: string }>;
}) {
  const { dispatchedFrom, dispatchedTo } = await searchParams;
  const dailyQuery = buildFilterQueryString({ from: dispatchedFrom, to: dispatchedTo });

  return (
    <SummaryContent
      title="Deployed Devices Summary"
      description="Total devices marked Dispatched, grouped by device type."
      exportHref="/api/export/summary"
      dailyExportHref={`/api/export/daily-dispatched${dailyQuery}`}
      basePath="/summary"
      dispatchedFrom={dispatchedFrom}
      dispatchedTo={dispatchedTo}
    />
  );
}
