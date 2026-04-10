export default function PortalLoading() {
  return (
    <div className="space-y-6">
      {/* Title skeleton */}
      <div>
        <div className="h-7 w-48 rounded-md bg-bg-secondary animate-pulse" />
        <div className="mt-2 h-4 w-72 rounded bg-bg-secondary animate-pulse" />
      </div>

      {/* Proposal cards skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-background p-5 space-y-4">
            <div className="h-5 w-3/4 rounded bg-bg-secondary animate-pulse" />
            <div className="h-4 w-1/2 rounded bg-bg-secondary animate-pulse" />
            <div className="flex items-center gap-2">
              <div className="h-6 w-20 rounded-full bg-bg-secondary animate-pulse" />
              <div className="h-4 w-24 rounded bg-bg-secondary animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
