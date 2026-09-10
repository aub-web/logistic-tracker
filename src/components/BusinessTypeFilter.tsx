const fieldClass =
  "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10";

export default function BusinessTypeFilter({
  businessType,
  basePath,
}: {
  businessType?: string;
  basePath: string;
}) {
  return (
    <form className="mt-4 flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="deployedBusinessType" className="text-xs font-medium text-zinc-500">
          Business Type
        </label>
        <select
          id="deployedBusinessType"
          name="deployedBusinessType"
          defaultValue={businessType ?? ""}
          className={`w-48 ${fieldClass}`}
        >
          <option value="">All</option>
          <option value="DIRECT_BUSINESS">Direct Business</option>
          <option value="EXTERNAL_PARTNER">External Partner</option>
        </select>
      </div>
      <button
        type="submit"
        className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
      >
        Filter
      </button>
      {businessType && (
        <a
          href={basePath}
          className="px-1 py-2 text-sm font-medium text-zinc-500 underline-offset-2 hover:text-zinc-700 hover:underline"
        >
          Clear
        </a>
      )}
    </form>
  );
}
