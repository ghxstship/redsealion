export default function HubTabLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-48 rounded bg-zinc-200" />
          <div className="mt-2 h-4 w-72 rounded bg-zinc-100" />
        </div>
      </div>
      <div className="h-10 w-full rounded-lg bg-zinc-100" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-zinc-200 bg-background p-4">
            <div className="h-3 w-20 rounded bg-zinc-200" />
            <div className="mt-2 h-7 w-12 rounded bg-zinc-100" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-zinc-200 bg-background overflow-hidden">
        <div className="h-10 bg-zinc-100 border-b border-zinc-200" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-zinc-100 px-4 py-3">
            <div className="h-4 flex-1 rounded bg-zinc-100" />
            <div className="h-4 w-20 rounded bg-zinc-100" />
            <div className="h-4 w-16 rounded bg-zinc-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
