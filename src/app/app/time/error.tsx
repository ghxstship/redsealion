'use client';

import { AlertTriangle } from 'lucide-react';

import Button from '@/components/ui/Button';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <AlertTriangle size={40} className="text-amber-500" />
      <h2 className="text-lg font-semibold text-foreground">Something went wrong</h2>
      <p className="text-sm text-text-muted max-w-md">{error.message}</p>
      <Button variant="secondary" onClick={() => reset()}>Try again</Button>
    </div>
  );
}
