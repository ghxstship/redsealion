export default function MarketingLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-600" />
        <p className="text-sm text-zinc-400">Loading...</p>
      </div>
    </div>
  );
}
