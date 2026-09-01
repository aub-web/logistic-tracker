const fieldClass =
  "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10";

export default function DateRangeFilter({
  fromName,
  toName,
  dateFrom,
  dateTo,
  basePath,
}: {
  fromName: string;
  toName: string;
  dateFrom?: string;
  dateTo?: string;
  basePath: string;
}) {
  return (
    <form className="mt-4 flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor={fromName} className="text-xs font-medium text-zinc-500">
          From
        </label>
        <input id={fromName} type="date" name={fromName} defaultValue={dateFrom} className={fieldClass} />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={toName} className="text-xs font-medium text-zinc-500">
          To
        </label>
        <input id={toName} type="date" name={toName} defaultValue={dateTo} className={fieldClass} />
      </div>
      <button
        type="submit"
        className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
      >
        Filter
      </button>
      {(dateFrom || dateTo) && (
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
