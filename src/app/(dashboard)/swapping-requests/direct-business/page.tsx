import { listSwappingRequests } from "@/lib/data";
import SwappingRequestsTable from "@/components/SwappingRequestsTable";
import SyncButton from "@/components/SyncButton";
import SearchBar from "@/components/SearchBar";

export default async function SwappingRequestsDirectBusinessPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const requests = await listSwappingRequests("DIRECT_BUSINESS", q);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">
            Swapping Requests — Direct Business
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            SD card swap requests from Direct Business accounts.
          </p>
        </div>
        <SyncButton />
      </div>

      <div className="mt-4">
        <SearchBar defaultValue={q} placeholder="Search business, contact, SDR, or req. ID" />
      </div>

      <SwappingRequestsTable requests={requests} />
    </div>
  );
}
