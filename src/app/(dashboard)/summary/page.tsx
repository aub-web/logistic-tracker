import SummaryContent from "@/components/SummaryContent";

export default async function SummaryPage({
  searchParams,
}: {
  searchParams: Promise<{
    dispatchedFrom?: string;
    dispatchedTo?: string;
    deployedBusinessType?: string;
  }>;
}) {
  const { dispatchedFrom, dispatchedTo, deployedBusinessType } = await searchParams;

  return (
    <SummaryContent
      dispatchedFrom={dispatchedFrom}
      dispatchedTo={dispatchedTo}
      deployedBusinessType={deployedBusinessType}
    />
  );
}
