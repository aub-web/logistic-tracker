import type { InventoryImportSummary } from "@/lib/data";

// Powerbank isn't tracked as its own available count — it's handed out
// 1:1 alongside Multicam and Mono Insta 360 units, so its own "available"
// number wouldn't mean anything independent of those.
const EXCLUDED_CATEGORIES = new Set(["Powerbank"]);

/** Units sitting in the warehouse ready to send out — the last imported
 * physical count minus what's currently deployed. Only shown for
 * categories that actually have an imported count; a category nobody's
 * counted yet just doesn't get a card instead of showing a misleading 0. */
export default function AvailableUnitsCards({
  inventory,
}: {
  inventory: InventoryImportSummary | null;
}) {
  const available = (inventory?.rows ?? []).filter(
    (r) => r.physicalCount !== null && !EXCLUDED_CATEGORIES.has(r.category),
  );
  if (available.length === 0) return null;

  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold text-zinc-900">Available Units</h2>
      <p className="mt-1 text-sm text-zinc-500">
        In stock and not yet deployed — last imported physical count minus Total Deployed.
      </p>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {available.map((row) => (
          <div key={row.category} className="rounded-xl border border-zinc-200 bg-white p-5">
            <p className="text-sm font-medium text-zinc-500">{row.category}</p>
            <p
              className={`mt-2 text-3xl font-semibold ${
                (row.variance ?? 0) < 0 ? "text-rose-600" : "text-zinc-900"
              }`}
            >
              {row.variance}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
