'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 2.58 9 2.58h0v1Z" fill="#EA4335" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
      <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
      <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
      <path d="m2 2 20 20" />
    </svg>
  );
}

/** Map of error codes to user-friendly messages. */
const ERROR_BANNERS: Record<string, { message: string; type: 'error' | 'warning' }> = {
  oauth_failed: { message: 'OAuth sign-in failed. Please try again or use a different sign-in method.', type: 'error' },
  account_suspended: { message: 'Your account has been suspended. Please contact your organization administrator.', type: 'warning' },
  account_deleted: { message: 'This account has been scheduled for deletion. Contact support if you believe this is a mistake.', type: 'error' },
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'password' | 'magic-link'>('password');
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  // C-03: Read error from query params (set by middleware or auth callback)
  const errorParam = searchParams.get('error');
  const errorBanner = errorParam ? ERROR_BANNERS[errorParam] : null;

  // C-04: Read redirect destination from query params (set by middleware)
  const redirectTo = searchParams.get('redirect') ?? '/app';

  // Clear URL params after displaying the error (avoid stale state on refresh)
  useEffect(() => {
    if (errorParam) {
      const url = new URL(window.location.href);
      url.searchParams.delete('error');
      url.searchParams.delete('redirect');
      window.history.replaceState({}, '', url.pathname + url.search);
    }
  }, [errorParam]);

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      // C-04: Navigate to the original destination
      router.push(redirectTo);
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      // C-08: Route through auth callback so membership checks happen
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
        },
      });

      if (error) {
        setError(error.message);
        return;
      }

      setMagicLinkSent(true);
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
        },
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError('An unexpected error occurred.');
      setLoading(false);
    }
  }

  if (magicLinkSent) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white px-8 py-12 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Check your email
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            We sent a magic link to{' '}
            <span className="font-medium text-zinc-700">{email}</span>
          </p>
        </div>
        <button
          onClick={() => {
            setMagicLinkSent(false);
            setMode('password');
          }}
          className="w-full text-center text-sm text-zinc-500 transition-colors hover:text-zinc-900"
        >
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white px-8 py-12 shadow-sm">
      <div className="mb-8 text-center">
        <div className="mb-6 inline-flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900">
            <span className="text-xs font-bold text-white">FD</span>
          </div>
          <span className="text-lg font-semibold tracking-tight text-zinc-900">
            FlyteDeck
          </span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Welcome back
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Sign in to your account to continue
        </p>
      </div>

      {/* C-03: Show contextual error banner from query params */}
      {errorBanner && (
        <div
          className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
            errorBanner.type === 'warning'
              ? 'border-amber-200 bg-amber-50 text-amber-800'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {errorBanner.message}
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Social login */}
      <div className="mb-6 space-y-3">
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <GoogleIcon />
          Continue with Google
        </button>
      </div>

      {/* Divider */}
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-3 text-zinc-400">or</span>
        </div>
      </div>

      <form
        onSubmit={mode === 'password' ? handlePasswordLogin : handleMagicLink}
        className="space-y-4"
      >
        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-sm font-medium text-zinc-700"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            required
            className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          />
        </div>

        {mode === 'password' && (
          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-zinc-700"
            >
              Password
            </label>
            {/* L-02: Password field with show/hide toggle */}
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 pr-10 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors hover:text-zinc-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? 'Signing in...'
            : mode === 'password'
              ? 'Sign in'
              : 'Send magic link'}
        </button>
      </form>

      <div className="mt-4 flex items-center justify-center gap-4">
        <button
          onClick={() => {
            setMode(mode === 'password' ? 'magic-link' : 'password');
            setError(null);
          }}
          className="text-sm text-zinc-500 transition-colors hover:text-zinc-900"
        >
          {mode === 'password'
            ? 'Sign in with magic link'
            : 'Sign in with password'}
        </button>
        <span className="text-zinc-300">·</span>
        <Link
          href="/forgot-password"
          className="text-sm text-zinc-500 transition-colors hover:text-zinc-900"
        >
          Forgot password?
        </Link>
      </div>

      <div className="mt-6 text-center text-xs text-zinc-500">
        By continuing, you agree to our{' '}
        <Link href="/terms" className="underline hover:text-zinc-900">Terms of Service</Link>
        {' '}and{' '}
        <Link href="/privacy" className="underline hover:text-zinc-900">Privacy Policy</Link>.
      </div>

      <div className="mt-8 border-t border-zinc-100 pt-6 text-center text-sm text-zinc-500">
        Don&apos;t have an account?{' '}
        <Link
          href="/signup"
          className="font-medium text-zinc-900 transition-colors hover:text-zinc-700"
        >
          Sign up
        </Link>
      </div>
    </div>
  );
}
