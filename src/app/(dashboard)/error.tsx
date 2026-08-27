"use client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 px-6 py-16 text-center">
      <h2 className="text-lg font-semibold text-red-800">Couldn&rsquo;t load this page</h2>
      <p className="mt-2 max-w-md text-sm text-red-700">
        {error.message.includes("reach database")
          ? "Can't reach the database. Check DATABASE_URL in your environment."
          : "Something went wrong loading requests."}
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-800"
      >
        Try again
      </button>
    </div>
  );
}
