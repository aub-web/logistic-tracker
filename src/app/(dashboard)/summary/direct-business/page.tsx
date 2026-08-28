import SummaryContent from "@/components/SummaryContent";

export default function SummaryDirectBusinessPage() {
  return (
    <SummaryContent
      businessType="DIRECT_BUSINESS"
      title="Deployed Devices Summary — Direct Business"
      description="Dispatched devices for Direct Business accounts, grouped by device type."
      exportHref="/api/export/summary?businessType=DIRECT_BUSINESS"
    />
  );
}
