'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import FormInput from '@/components/ui/FormInput';

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

interface PasswordPolicy {
  password_min_length: number;
  password_require_uppercase: boolean;
  password_require_number: boolean;
  password_require_symbol: boolean;
}

const DEFAULT_POLICY: PasswordPolicy = {
  password_min_length: 8,
  password_require_uppercase: false,
  password_require_number: false,
  password_require_symbol: false,
};

/** H-04: Validate password against the org's auth_settings policy. */
function validatePassword(pw: string, policy: PasswordPolicy): string | null {
  if (pw.length < policy.password_min_length) {
    return `Password must be at least ${policy.password_min_length} characters.`;
  }
  if (policy.password_require_uppercase && !/[A-Z]/.test(pw)) {
    return 'Password must contain at least one uppercase letter.';
  }
  if (policy.password_require_number && !/[0-9]/.test(pw)) {
    return 'Password must contain at least one number.';
  }
  if (policy.password_require_symbol && !/[^A-Za-z0-9]/.test(pw)) {
    return 'Password must contain at least one special character.';
  }
  return null;
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [ready, setReady] = useState(false);
  const [policy, setPolicy] = useState<PasswordPolicy>(DEFAULT_POLICY);

  useEffect(() => {
    // The user arrives here via Supabase's password reset email link.
    // Supabase will automatically exchange the recovery token for a session
    // via the auth callback or the URL hash fragment. We just need to
    // verify a session exists.
    const supabase = createClient();

    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        setReady(true);

        // H-04: Fetch the org's password policy
        try {
          const { data: membership } = await supabase
            .from('organization_memberships')
            .select('organization_id')
            .eq('user_id', data.user.id)
            .eq('status', 'active')
            .limit(1)
            .single();

          if (membership) {
            const { data: authSettings } = await supabase
              .from('auth_settings')
              .select('password_min_length, password_require_uppercase, password_require_number, password_require_symbol')
              .eq('organization_id', membership.organization_id)
              .single();

            if (authSettings) {
              setPolicy(authSettings);
            }
          }
        } catch {
          // Non-fatal — use default policy
        }
      } else {
        setError('Invalid or expired reset link. Please request a new one.');
      }
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // H-04: Validate against org policy
    const policyError = validatePassword(password, policy);
    if (policyError) {
      setError(policyError);
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

      // M-12: Revoke other sessions after password change
      // This is a best-effort call via API since the client SDK
      // doesn't expose session management for other sessions.
      try {
        await fetch('/api/v1/sessions', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: 'password_change', keep_current: true }),
        });
      } catch {
        // Non-fatal — the password was still changed successfully
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

      {/* H-04: Display password requirements */}
      {ready && (
        <div className="mb-6 rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-3">
          <p className="text-xs font-medium text-zinc-600 mb-1">Password requirements:</p>
          <ul className="text-xs text-zinc-500 space-y-0.5">
            <li>• At least {policy.password_min_length} characters</li>
            {policy.password_require_uppercase && <li>• One uppercase letter</li>}
            {policy.password_require_number && <li>• One number</li>}
            {policy.password_require_symbol && <li>• One special character</li>}
          </ul>
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
            {/* L-02: Password with show/hide toggle */}
            <div className="relative">
              <FormInput
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={`At least ${policy.password_min_length} characters`}
                required
                minLength={policy.password_min_length}
                className="pr-10"
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

          <div>
            <label
              htmlFor="confirm"
              className="mb-1.5 block text-sm font-medium text-zinc-700"
            >
              Confirm password
            </label>
            <div className="relative">
              <FormInput
                id="confirm"
                type={showConfirm ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter your new password"
                required
                minLength={policy.password_min_length}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors hover:text-zinc-600"
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
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
