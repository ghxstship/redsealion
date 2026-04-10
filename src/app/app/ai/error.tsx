'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function AiError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('AI page error:', error);
  }, [error]);

  // Detect specific error types
  const is503 = error.message?.includes('not configured') || error.message?.includes('503');
  const is429 = error.message?.includes('rate limit') || error.message?.includes('429');
  const is403 = error.message?.includes('Forbidden') || error.message?.includes('403');

  let title = 'AI Assistant Error';
  let message = 'Something went wrong with the AI assistant. Please try again.';
  let action = 'Try Again';

  if (is503) {
    title = 'AI Not Configured';
    message = 'The AI assistant requires an API key to function. Please contact your administrator to configure the ANTHROPIC_API_KEY.';
    action = 'Retry';
  } else if (is429) {
    title = 'Rate Limit Reached';
    message = 'You\'ve sent too many messages in a short time. Please wait a moment before trying again.';
    action = 'Try Again';
  } else if (is403) {
    title = 'Access Denied';
    message = 'Your current plan or role does not include AI assistant access. Please contact your administrator to upgrade.';
    action = 'Go Back';
  }

  return (
    <div className="mx-auto max-w-lg py-20">
      <div className="rounded-xl border border-border bg-background p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 mb-4">
          <AlertTriangle size={24} className="text-amber-600" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">{title}</h2>
        <p className="text-sm text-text-muted mb-6 leading-relaxed">{message}</p>
        <Button onClick={reset} variant="secondary">
          <RefreshCw size={14} className="mr-1.5" />
          {action}
        </Button>
      </div>
    </div>
  );
}
