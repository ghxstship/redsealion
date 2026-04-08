'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // The user arrives here via Supabase's password reset email link.
    // Supabase will automatically exchange the recovery token for a session
    // via the auth callback or the URL hash fragment. We just need to
    // verify a session exists.
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setReady(true);
      } else {
        setError('Invalid or expired reset link. Please request a new one.');
      }
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setError(error.message);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push('/app'), 2000);
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white px-8 py-12 shadow-sm text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Password updated
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Redirecting you to the dashboard…
        </p>
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
          Set a new password
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Choose a new password for your account
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {ready ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-zinc-700"
            >
              New password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
              minLength={8}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            />
          </div>

          <div>
            <label
              htmlFor="confirm"
              className="mb-1.5 block text-sm font-medium text-zinc-700"
            >
              Confirm password
            </label>
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter your new password"
              required
              minLength={8}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update password'}
          </button>
        </form>
      ) : !error ? (
        <div className="text-center text-sm text-zinc-500">
          Validating reset link…
        </div>
      ) : null}
    </div>
  );
}
