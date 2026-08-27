import { listDeviceRequests } from "@/lib/data";
import DeviceRequestsTable from "@/components/DeviceRequestsTable";
import SyncButton from "@/components/SyncButton";
import SearchBar from "@/components/SearchBar";

export default async function DeviceRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const requests = await listDeviceRequests(undefined, q);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Device Requests</h1>
          <p className="mt-1 text-sm text-zinc-500">
            All drop-off, replacement, and pull-out requests from the Device Request form.
          </p>
        </div>
        <SyncButton />
      </div>

      <div className="mt-4">
        <SearchBar defaultValue={q} placeholder="Search business, contact, SDR, or req. ID" />
      </div>

      <DeviceRequestsTable requests={requests} />
    </div>
  );
}
