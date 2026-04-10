export default function DispatchBoardLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-7 w-48 rounded bg-zinc-200" />
      <div className="h-4 w-72 rounded bg-zinc-100" />
      <div className="h-10 w-full rounded bg-zinc-100" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-bg-secondary/30 p-3 space-y-3">
            <div className="h-3 w-20 rounded bg-zinc-200" />
            <div className="h-24 rounded-lg bg-zinc-100" />
            <div className="h-24 rounded-lg bg-zinc-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
