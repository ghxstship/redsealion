'use client';

import Link from 'next/link';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

export default function MyScheduleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="max-w-md w-full space-y-6 text-center">
        <Alert variant="error">
          <div className="text-3xl mb-2">⚠️</div>
          <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
          <p className="text-sm">
            {error.message || 'Failed to load your schedule. Please try again.'}
          </p>
        </Alert>
        <div className="flex items-center justify-center gap-3">
          <Button onClick={reset} variant="secondary">
            Try Again
          </Button>
          <Link
            href="/app"
            className="text-sm font-medium text-text-secondary hover:text-foreground underline"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
