export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-7 w-48 rounded bg-zinc-200" />
        <div className="h-6 w-20 rounded-full bg-zinc-100" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-zinc-200 bg-background p-5 space-y-3">
            <div className="h-5 w-32 rounded bg-zinc-200" />
            <div className="h-4 w-full rounded bg-zinc-100" />
            <div className="h-4 w-3/4 rounded bg-zinc-100" />
          </div>
          <div className="rounded-xl border border-zinc-200 bg-background p-5 space-y-3">
            <div className="h-5 w-24 rounded bg-zinc-200" />
            <div className="h-32 rounded bg-zinc-50" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-200 bg-background p-5 space-y-3">
            <div className="h-5 w-20 rounded bg-zinc-200" />
            <div className="h-4 w-full rounded bg-zinc-100" />
            <div className="h-4 w-full rounded bg-zinc-100" />
            <div className="h-4 w-2/3 rounded bg-zinc-100" />
          </div>
        </div>
      </div>
    </div>
  );
}
