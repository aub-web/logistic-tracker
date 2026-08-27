import { listDeviceRequests } from "@/lib/data";
import DeviceRequestsTable from "@/components/DeviceRequestsTable";
import SyncButton from "@/components/SyncButton";
import SearchBar from "@/components/SearchBar";

export default async function DeviceRequestsExternalPartnerPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const requests = await listDeviceRequests("EXTERNAL_PARTNER", q);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">
            Device Requests — External Partner
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Requests from External Partner accounts.
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
