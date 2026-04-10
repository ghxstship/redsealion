export default function MarketplaceLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header skeleton */}
      <div>
        <div className="h-7 w-44 rounded bg-zinc-200 mb-2" />
        <div className="h-4 w-72 rounded bg-zinc-100" />
      </div>

      {/* Filters skeleton */}
      <div className="flex gap-3">
        <div className="h-10 w-64 rounded-lg bg-zinc-100" />
        <div className="h-10 w-36 rounded-lg bg-zinc-100" />
        <div className="h-10 w-36 rounded-lg bg-zinc-100" />
        <div className="h-10 w-20 rounded-lg bg-zinc-200" />
      </div>

      {/* Table skeleton */}
      <div className="rounded-xl border border-border bg-background overflow-hidden">
        {/* Header row */}
        <div className="flex gap-4 px-6 py-3 bg-bg-secondary border-b border-border">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-3 rounded bg-zinc-200" style={{ width: `${60 + i * 12}px` }} />
          ))}
        </div>
        {/* Data rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-3.5 border-b border-border last:border-none">
            <div className="h-4 w-20 rounded bg-zinc-100" />
            <div className="h-4 w-40 rounded bg-zinc-100" />
            <div className="h-5 w-16 rounded-full bg-zinc-100" />
            <div className="h-4 w-24 rounded bg-zinc-100" />
            <div className="h-4 w-20 rounded bg-zinc-100" />
            <div className="h-4 w-24 rounded bg-zinc-100" />
            <div className="h-4 w-20 rounded bg-zinc-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
