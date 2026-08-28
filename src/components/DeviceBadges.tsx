// Only the categories a business actually has counts for — no columns full
// of dashes for device types it's never touched.
export default function DeviceBadges({ counts }: { counts: Record<string, number> }) {
  const entries = Object.entries(counts).filter(([, count]) => count > 0);
  if (entries.length === 0) return <span className="text-zinc-400">—</span>;

  return (
    <div className="flex flex-wrap gap-1.5">
      {entries.map(([category, count]) => (
        <span
          key={category}
          className="whitespace-nowrap rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700"
        >
          {category}: {count}
        </span>
      ))}
    </div>
  );
}
