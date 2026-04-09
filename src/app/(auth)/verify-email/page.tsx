'use client';

import { useState } from 'react';

/**
 * Email verification pending page.
 *
 * Shown when a user signs up but hasn't confirmed their email yet.
 * Provides a resend button and instructions.
 */
export default function VerifyEmailPage() {
  const [resent, setResent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleResend() {
    setLoading(true);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user?.email) {
        await supabase.auth.resend({
          type: 'signup',
          email: user.email,
        });
        setResent(true);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-background px-8 py-12 shadow-sm text-center">
        <div className="mb-6 inline-flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground">
            <span className="text-xs font-bold text-white">FD</span>
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            FlyteDeck
          </span>
        </div>

        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
          <svg
            className="h-8 w-8 text-blue-500"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
            />
          </svg>
        </div>

        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Verify your email
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          We&apos;ve sent a verification link to your email address.
          Please check your inbox and click the link to activate your account.
        </p>

        <div className="mt-8 space-y-3">
          {resent ? (
            <p className="text-sm font-medium text-green-600">
              Verification email resent! Check your inbox.
            </p>
          ) : (
            <button
              onClick={handleResend}
              disabled={loading}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Resend verification email'}
            </button>
          )}

          <a
            href="/login"
            className="block text-sm text-text-secondary hover:text-foreground transition-colors"
          >
            ← Back to login
          </a>
        </div>
      </div>
    </div>
  );
}
