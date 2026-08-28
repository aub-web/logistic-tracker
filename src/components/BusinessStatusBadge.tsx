import type { BusinessLifecycleStatus } from "@/lib/data";

export default function BusinessStatusBadge({
  status,
}: {
  status: BusinessLifecycleStatus | undefined;
}) {
  if (!status) return <span className="text-zinc-400">—</span>;

  const pulledOut = status === "PULLED_OUT";
  return (
    <span
      className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ${
        pulledOut ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-800"
      }`}
    >
      {pulledOut ? "Pulled Out" : "Active"}
    </span>
  );
}
