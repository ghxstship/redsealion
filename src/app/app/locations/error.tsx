'use client';

import { useEffect } from 'react';
import Button from '@/components/ui/Button';

export default function LocationsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Locations Module Error:', error);
  }, [error]);

  return (
    <div className="flex h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <div className="rounded-full bg-red-500/10 p-4">
        <span className="text-3xl">⚠️</span>
      </div>
      <h2 className="text-xl font-semibold text-foreground">Failed to load location data</h2>
      <p className="text-sm text-text-secondary max-w-md">
        There was a problem loading the requested location information.
        {error.message && <span className="block mt-2 text-xs font-mono text-red-600 bg-red-500/10 p-2 rounded">{error.message}</span>}
      </p>
      <div className="flex gap-3 mt-2">
        <Button onClick={reset}>Try again</Button>
        <Button variant="secondary" onClick={() => window.history.back()}>Go back</Button>
      </div>
    </div>
  );
}
