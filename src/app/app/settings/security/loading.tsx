export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-7 w-40 rounded bg-zinc-200" />
      <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-24 rounded bg-zinc-200" />
            <div className="h-10 w-full rounded-lg bg-zinc-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
