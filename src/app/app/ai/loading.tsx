export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header skeleton */}
      <div>
        <div className="h-7 w-32 rounded bg-zinc-200" />
        <div className="mt-2 h-4 w-56 rounded bg-zinc-100" />
      </div>

      {/* Chat panel skeleton */}
      <div className="mx-auto max-w-3xl">
        <div className="rounded-xl border border-zinc-200 bg-background overflow-hidden">
          {/* Chat header */}
          <div className="flex items-center gap-3 px-5 h-12 border-b border-zinc-200 bg-zinc-50">
            <div className="h-7 w-7 rounded-lg bg-zinc-200" />
            <div className="h-4 w-28 rounded bg-zinc-200" />
          </div>

          {/* Message bubbles */}
          <div className="h-[520px] px-6 py-5 space-y-4">
            {/* Assistant message */}
            <div className="flex justify-start">
              <div className="max-w-[75%] rounded-xl bg-zinc-100 px-4 py-3">
                <div className="h-3 w-64 rounded bg-zinc-200 mb-2" />
                <div className="h-3 w-48 rounded bg-zinc-200" />
              </div>
            </div>

            {/* Suggestion chips */}
            <div className="flex gap-2 mt-6">
              <div className="h-7 w-40 rounded-full bg-zinc-100 border border-zinc-200" />
              <div className="h-7 w-36 rounded-full bg-zinc-100 border border-zinc-200" />
              <div className="h-7 w-44 rounded-full bg-zinc-100 border border-zinc-200" />
            </div>
          </div>

          {/* Input bar */}
          <div className="flex items-center gap-2 border-t border-zinc-200 px-4 py-3">
            <div className="flex-1 h-10 rounded-lg bg-zinc-100 border border-zinc-200" />
            <div className="h-9 w-9 rounded-lg bg-zinc-200" />
          </div>
        </div>
      </div>
    </div>
  );
}
