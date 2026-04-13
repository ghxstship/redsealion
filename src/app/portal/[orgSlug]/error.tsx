'use client';

import Button from '@/components/ui/Button';

/**
 * Portal error boundary — uses CSS variables to respect org branding.
 * M-11: Fixed hardcoded red colors that didn't adapt to dark mode.
 */
export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="rounded-2xl border border-border bg-background p-8 text-center max-w-md shadow-sm">
        <div
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
          style={{ backgroundColor: 'var(--org-primary, #ef4444)', opacity: 0.1 }}
        />
        <h2 className="text-lg font-semibold text-foreground">Something went wrong</h2>
        <p className="mt-2 text-sm text-text-secondary">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <Button
          onClick={reset}
          className="mt-4 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: 'var(--org-primary, var(--color-foreground))' }}
        >
          Try again
        </Button>
      </div>
    </div>
  );
}
