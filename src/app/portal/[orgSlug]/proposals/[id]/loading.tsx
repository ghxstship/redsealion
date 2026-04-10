export default function ProposalDetailLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Back link */}
      <div className="h-3 w-32 rounded bg-bg-secondary" />

      {/* Title */}
      <div className="h-6 w-64 rounded bg-bg-secondary" />

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-4 w-20 rounded bg-bg-secondary" />
        ))}
      </div>

      {/* Content area */}
      <div className="space-y-4">
        <div className="rounded-lg border border-border p-5 space-y-3">
          <div className="h-5 w-1/3 rounded bg-bg-secondary" />
          <div className="h-4 w-2/3 rounded bg-bg-secondary" />
          <div className="h-4 w-1/2 rounded bg-bg-secondary" />
        </div>
        <div className="rounded-lg border border-border p-5 space-y-3">
          <div className="h-5 w-1/4 rounded bg-bg-secondary" />
          <div className="h-4 w-3/4 rounded bg-bg-secondary" />
          <div className="h-4 w-1/3 rounded bg-bg-secondary" />
        </div>
      </div>
    </div>
  );
}
