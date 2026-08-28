import SummaryContent from "@/components/SummaryContent";

export default function SummaryPage() {
  return (
    <SummaryContent
      title="Deployed Devices Summary"
      description="Total devices marked Dispatched, grouped by device type."
      exportHref="/api/export/summary"
    />
  );
}
