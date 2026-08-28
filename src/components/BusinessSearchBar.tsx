export default function BusinessSearchBar({
  query,
  basePath,
}: {
  query?: string;
  basePath: string;
}) {
  return (
    <form className="mt-4 flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="q" className="text-xs font-medium text-zinc-500">
          Search
        </label>
        <input
          id="q"
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search business name"
          className="w-64 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
        />
      </div>
      <button
        type="submit"
        className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
      >
        Search
      </button>
      {query && (
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
