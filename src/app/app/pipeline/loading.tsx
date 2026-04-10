export default function PipelineLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-48 rounded bg-zinc-200" />
      <div className="h-4 w-96 rounded bg-zinc-100" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-40 rounded-xl border border-zinc-200 bg-zinc-50" />
        ))}
      </div>
    </div>
  );
}
