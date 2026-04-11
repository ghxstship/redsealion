'use client';

import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

export default function AssetDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="max-w-md space-y-6">
        <Alert variant="error">
          <h2 className="text-lg font-semibold mb-2">Failed to load asset</h2>
          <p className="text-sm">
            {error.message || 'An unexpected error occurred while loading this asset.'}
          </p>
        </Alert>
        <div className="flex items-center justify-center gap-3">
          <Button variant="secondary" onClick={() => window.history.back()}>
            Go Back
          </Button>
          <Button onClick={() => reset()}>Try Again</Button>
        </div>
      </div>
    </div>
  );
}
