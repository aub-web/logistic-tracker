const fieldClass =
  "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10";
const labelClass = "text-xs font-medium text-zinc-500";

export default function RequestFilters({
  query,
  sdrName,
  deviceType,
  dateFrom,
  dateTo,
  sdrOptions,
  deviceOptions,
  basePath,
}: {
  query?: string;
  sdrName?: string;
  deviceType?: string;
  dateFrom?: string;
  dateTo?: string;
  sdrOptions: string[];
  /** Omit entirely for Swapping Requests, which has no device dimension. */
  deviceOptions?: string[];
  basePath: string;
}) {
  const hasActiveFilters = Boolean(query || sdrName || deviceType || dateFrom || dateTo);

  return (
    <form className="mt-4 flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="q" className={labelClass}>
          Search
        </label>
        <input
          id="q"
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Business, contact, SDR, or req. ID"
          className={`w-56 ${fieldClass}`}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="sdr" className={labelClass}>
          SDR
        </label>
        <select id="sdr" name="sdr" defaultValue={sdrName ?? ""} className={`w-40 ${fieldClass}`}>
          <option value="">All SDRs</option>
          {sdrOptions.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {deviceOptions && (
        <div className="flex flex-col gap-1">
          <label htmlFor="device" className={labelClass}>
            Device
          </label>
          <select
            id="device"
            name="device"
            defaultValue={deviceType ?? ""}
            className={`w-48 ${fieldClass}`}
          >
            <option value="">All Devices</option>
            {deviceOptions.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="from" className={labelClass}>
          From
        </label>
        <input id="from" type="date" name="from" defaultValue={dateFrom} className={fieldClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="to" className={labelClass}>
          To
        </label>
        <input id="to" type="date" name="to" defaultValue={dateTo} className={fieldClass} />
      </div>

      <button
        type="submit"
        className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
      >
        Filter
      </button>

      {hasActiveFilters && (
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
