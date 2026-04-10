'use client';

import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function MarketplaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="max-w-md w-full rounded-xl border border-red-200 bg-red-50 p-8 text-center">
        <div className="text-3xl mb-4">⚠️</div>
        <h2 className="text-lg font-semibold text-red-800 mb-2">Something went wrong</h2>
        <p className="text-sm text-red-700 mb-6">
          {error.message || 'Failed to load the marketplace. Please try again.'}
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button onClick={reset} variant="secondary">
            Try Again
          </Button>
          <Link
            href="/app"
            className="text-sm font-medium text-red-700 hover:text-red-900 underline"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
