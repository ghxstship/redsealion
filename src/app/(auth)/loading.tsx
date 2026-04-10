/**
 * M-01: Loading skeleton for auth pages.
 * Displays a pulsing card placeholder while page content loads.
 */
export default function AuthLoading() {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white px-8 py-12 shadow-sm animate-pulse">
      <div className="flex flex-col items-center">
        <div className="mb-6 flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-zinc-200" />
          <div className="h-5 w-24 rounded bg-zinc-200" />
        </div>
        <div className="h-7 w-48 rounded bg-zinc-200 mb-2" />
        <div className="h-4 w-56 rounded bg-zinc-100" />
      </div>

      <div className="mt-8 space-y-4">
        <div className="h-10 rounded-lg bg-zinc-100" />
        <div className="h-10 rounded-lg bg-zinc-100" />
        <div className="h-10 rounded-lg bg-zinc-200" />
      </div>
    </div>
  );
}
