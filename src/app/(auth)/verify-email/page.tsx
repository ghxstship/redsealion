'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';

/**
 * Email verification pending page.
 *
 * Shown when a user signs up but hasn't confirmed their email yet.
 * Provides a resend button, error handling, and auto-redirect on confirmation.
 */
export default function VerifyEmailPage() {
  const [resent, setResent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // M-06: Auto-redirect when email is confirmed
  useEffect(() => {
    const supabase = createClient();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          // Email was confirmed — redirect to app or setup-org
          window.location.href = '/auth/callback';
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function handleResend() {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user?.email) {
        const { error: resendError } = await supabase.auth.resend({
          type: 'signup',
          email: user.email,
        });

        if (resendError) {
          // M-05: Show error instead of silently failing
          setError(resendError.message);
          return;
        }

        setResent(true);
        setCooldown(60); // 60-second cooldown between resends
      } else {
        setError('No email address found. Please try signing up again.');
      }
    } catch {
      // M-05: Show error instead of silently failing
      setError('Failed to resend verification email. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    // H-05: Use same zinc-based styling as other auth pages, no double-nesting
    <div className="rounded-2xl border border-border bg-background px-8 py-12 shadow-sm text-center">
      <div className="mb-6 inline-flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground">
          <span className="text-xs font-bold text-background">FD</span>
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
      <p className="mt-2 text-sm text-text-muted">
        We&apos;ve sent a verification link to your email address.
        Please check your inbox and click the link to activate your account.
      </p>

      {/* M-05: Show error state */}
      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-8 space-y-3">
        {resent && !error ? (
          <p className="text-sm font-medium text-green-600">
            Verification email resent! Check your inbox.
          </p>
        ) : null}

        <Button
          onClick={handleResend}
          disabled={loading || cooldown > 0}
          className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? 'Sending...'
            : cooldown > 0
              ? `Resend in ${cooldown}s`
              : 'Resend verification email'}
        </Button>

        {/* L-07: Use Link instead of <a> */}
        <Link
          href="/login"
          className="block text-sm text-text-muted hover:text-foreground transition-colors"
        >
          ← Back to login
        </Link>
      </div>
    </div>
  );
}
