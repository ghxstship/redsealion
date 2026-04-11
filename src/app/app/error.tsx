'use client';

import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="max-w-md text-center space-y-4">
        <Alert variant="error">
          <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
          <p className="text-sm">
            {error.message || 'An unexpected error occurred. Please try again.'}
          </p>
        </Alert>
        <Button variant="danger" onClick={reset}>
          Try again
        </Button>
      </div>
    </div>
  );
}
