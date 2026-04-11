'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function AdvancingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Advancing page error:', error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg py-20">
      <div className="rounded-xl border border-border bg-background p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 mb-4">
          <AlertTriangle size={24} className="text-amber-600" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">Something went wrong</h2>
        <p className="text-sm text-text-muted mb-6 leading-relaxed">
          An error occurred while loading advancing data. Please try again.
        </p>
        <Button onClick={reset} variant="secondary">
          <RefreshCw size={14} className="mr-1.5" />
          Try Again
        </Button>
      </div>
    </div>
  );
}
