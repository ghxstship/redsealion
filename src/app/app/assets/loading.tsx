export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-40 rounded bg-zinc-200" />
          <div className="mt-2 h-4 w-64 rounded bg-zinc-100" />
        </div>
        <div className="h-10 w-28 rounded-lg bg-zinc-200" />
      </div>
      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        <div className="h-10 bg-zinc-100 border-b border-zinc-200" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-zinc-100 px-4 py-3">
            <div className="h-4 w-4 rounded bg-zinc-200" />
            <div className="h-4 flex-1 rounded bg-zinc-100" />
            <div className="h-4 w-20 rounded bg-zinc-100" />
            <div className="h-4 w-16 rounded bg-zinc-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
