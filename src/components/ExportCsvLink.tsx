export default function ExportCsvLink({ href }: { href: string }) {
  return (
    <a
      href={href}
      className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
    >
      Export CSV
    </a>
  );
}
