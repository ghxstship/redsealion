'use client';

import Button from '@/components/ui/Button';

export default function ModuleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-background px-8 py-16 text-center">
      <div className="mb-4 text-4xl">⚠️</div>
      <h2 className="text-lg font-semibold text-foreground">Something went wrong</h2>
      <p className="mt-2 max-w-md text-sm text-text-secondary">
        {error?.message || 'An unexpected error occurred. Please try again.'}
      </p>
      <Button className="mt-6" onClick={reset}>
        Try Again
      </Button>
    </div>
  );
}
