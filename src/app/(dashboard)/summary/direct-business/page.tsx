import SummaryContent from "@/components/SummaryContent";
import { buildFilterQueryString } from "@/lib/filter-query";

export default async function SummaryDirectBusinessPage({
  searchParams,
}: {
  searchParams: Promise<{ dispatchedFrom?: string; dispatchedTo?: string }>;
}) {
  const { dispatchedFrom, dispatchedTo } = await searchParams;
  const dailyQuery = buildFilterQueryString({
    from: dispatchedFrom,
    to: dispatchedTo,
    businessType: "DIRECT_BUSINESS",
  });

  return (
    <SummaryContent
      businessType="DIRECT_BUSINESS"
      title="Deployed Devices Summary — Direct Business"
      description="Dispatched devices for Direct Business accounts, grouped by device type."
      exportHref="/api/export/summary?businessType=DIRECT_BUSINESS"
      dailyExportHref={`/api/export/daily-dispatched${dailyQuery}`}
      basePath="/summary/direct-business"
      dispatchedFrom={dispatchedFrom}
      dispatchedTo={dispatchedTo}
    />
  );
}
