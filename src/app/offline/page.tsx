'use client';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="text-center max-w-md">
        {/* FlyteDeck logo */}
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-foreground">
          <span className="text-2xl font-bold text-white">FD</span>
        </div>

        <h1 className="text-2xl font-semibold text-foreground mb-3">
          You&apos;re offline
        </h1>

        <p className="text-text-muted mb-8">
          Please check your connection and try again.
        </p>

        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 text-sm rounded-lg bg-foreground text-white hover:opacity-90 transition-opacity"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
