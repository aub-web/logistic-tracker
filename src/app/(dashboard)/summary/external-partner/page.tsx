import SummaryContent from "@/components/SummaryContent";
import { buildFilterQueryString } from "@/lib/filter-query";

export default async function SummaryExternalPartnerPage({
  searchParams,
}: {
  searchParams: Promise<{ dispatchedFrom?: string; dispatchedTo?: string }>;
}) {
  const { dispatchedFrom, dispatchedTo } = await searchParams;
  const dailyQuery = buildFilterQueryString({
    from: dispatchedFrom,
    to: dispatchedTo,
    businessType: "EXTERNAL_PARTNER",
  });

  return (
    <SummaryContent
      businessType="EXTERNAL_PARTNER"
      title="Deployed Devices Summary — External Partner"
      description="Dispatched devices for External Partner accounts, grouped by device type."
      exportHref="/api/export/summary?businessType=EXTERNAL_PARTNER"
      dailyExportHref={`/api/export/daily-dispatched${dailyQuery}`}
      basePath="/summary/external-partner"
      dispatchedFrom={dispatchedFrom}
      dispatchedTo={dispatchedTo}
    />
  );
}
