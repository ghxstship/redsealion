'use client';

import Button from '@/components/ui/Button';

export default function AssetDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="rounded-xl border border-red-200 bg-red-50/50 px-8 py-10 max-w-md">
        <h2 className="text-lg font-semibold text-red-800">Failed to load asset</h2>
        <p className="mt-2 text-sm text-red-700/80">
          {error.message || 'An unexpected error occurred while loading this asset.'}
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button variant="secondary" onClick={() => window.history.back()}>
            Go Back
          </Button>
          <Button onClick={() => reset()}>Try Again</Button>
        </div>
      </div>
    </div>
  );
}
