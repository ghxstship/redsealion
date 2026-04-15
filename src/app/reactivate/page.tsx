'use client';

import { useState } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function ReactivatePage() {
  const [requesting, setRequesting] = useState(false);
  const [requested, setRequested] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // M-09: "Request Reactivation" button
  async function handleRequestReactivation() {
    setRequesting(true);
    setError(null);

    try {
      const res = await fetch('/api/v1/join-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scope_type: 'organization',
          request_message: 'Requesting account reactivation.',
          auto_source: 'reactivation',
        }),
      });

      if (res.ok) {
        setRequested(true);
      } else {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? 'Failed to submit reactivation request.');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setRequesting(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg-secondary flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-background p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
          <svg className="text-amber-600" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M12 8v4" />
            <path d="M12 16h.01" />
          </svg>
        </div>

        <h1 className="text-xl font-semibold text-foreground">
          Account Deactivated
        </h1>

        <p className="mt-3 text-sm text-text-muted leading-relaxed">
          Your account has been deactivated by your organization&apos;s
          administrator. If you believe this is a mistake, you can request
          reactivation below or contact your admin directly.
        </p>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {requested && (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Reactivation request submitted! Your organization admin will review it.
          </div>
        )}

        <div className="mt-8 space-y-3">
          {/* M-09: Self-service reactivation request */}
          {!requested && (
            <Button
              onClick={handleRequestReactivation}
              disabled={requesting}
              className="block w-full rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {requesting ? 'Submitting...' : 'Request Reactivation'}
            </Button>
          )}

          <Link
            href="/login"
            className="block w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-secondary"
          >
            Back to Sign In
          </Link>
          <a
            href="mailto:support@flytedeck.com"
            className="block w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-secondary"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
