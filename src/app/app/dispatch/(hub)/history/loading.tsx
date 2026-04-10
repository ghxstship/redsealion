export default function DispatchHistoryLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-7 w-48 rounded bg-zinc-200" />
      <div className="h-4 w-72 rounded bg-zinc-100" />
      <div className="h-10 w-full rounded bg-zinc-100" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 mb-8">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-background p-4 space-y-2">
            <div className="h-3 w-20 rounded bg-zinc-100" />
            <div className="h-6 w-12 rounded bg-zinc-200" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-border bg-background p-6 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 w-full rounded bg-zinc-100" />
        ))}
      </div>
    </div>
  );
}
