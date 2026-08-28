import SummaryContent from "@/components/SummaryContent";

export default function SummaryExternalPartnerPage() {
  return (
    <SummaryContent
      businessType="EXTERNAL_PARTNER"
      title="Deployed Devices Summary — External Partner"
      description="Dispatched devices for External Partner accounts, grouped by device type."
      exportHref="/api/export/summary?businessType=EXTERNAL_PARTNER"
    />
  );
}
