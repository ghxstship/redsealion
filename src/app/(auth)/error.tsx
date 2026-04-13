'use client';

import Button from '@/components/ui/Button';

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center max-w-md">
        <h2 className="text-lg font-semibold text-red-900">Authentication Error</h2>
        <p className="mt-2 text-sm text-red-700">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <Button
          onClick={reset}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
        >
          Try again
        </Button>
      </div>
    </div>
  );
}
