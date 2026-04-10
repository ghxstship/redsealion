export default function AccountLoading() {
  return (
    <div className="space-y-10 animate-pulse">
      <div>
        <div className="h-7 w-32 rounded bg-bg-secondary" />
        <div className="mt-2 h-4 w-64 rounded bg-bg-secondary" />
      </div>

      {/* Profile section skeleton */}
      <div className="rounded-lg border border-border bg-background p-6">
        <div className="h-4 w-20 rounded bg-bg-secondary mb-5" />
        <div className="flex items-start gap-5">
          <div className="h-14 w-14 rounded-full bg-bg-secondary" />
          <div className="flex-1 grid gap-5 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <div className="h-3 w-16 rounded bg-bg-secondary mb-2" />
                <div className="h-9 w-full rounded bg-bg-secondary" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Notifications skeleton */}
      <div className="rounded-lg border border-border bg-background p-6">
        <div className="h-4 w-48 rounded bg-bg-secondary mb-5" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div>
                <div className="h-4 w-32 rounded bg-bg-secondary mb-1" />
                <div className="h-3 w-56 rounded bg-bg-secondary" />
              </div>
              <div className="h-5 w-9 rounded-full bg-bg-secondary" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
