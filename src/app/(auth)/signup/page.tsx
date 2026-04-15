'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import FormInput from '@/components/ui/FormInput';
import Button from '@/components/ui/Button';

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

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** L-03: Compute password strength score (0-4). */
function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { score, label: 'Weak', color: 'bg-red-400' };
  if (score === 2) return { score, label: 'Fair', color: 'bg-amber-400' };
  if (score === 3) return { score, label: 'Good', color: 'bg-blue-400' };
  return { score, label: 'Strong', color: 'bg-emerald-400' };
}

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Step 1: Account
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Step 2: Organization
  const [companyName, setCompanyName] = useState('');
  const [slug, setSlug] = useState('');

  const strength = getPasswordStrength(password);

  function handleCompanyNameChange(value: string) {
    setCompanyName(value);
    setSlug(generateSlug(value));
  }

  async function handleGoogleSignup() {
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();

      // Split full name into first/last for the onboard API
      const nameParts = fullName.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            given_name: firstName,
            family_name: lastName,
            company_name: companyName,
            company_slug: slug,
          },
        },
      });

      if (error) {
        setError(error.message);
        return;
      }

      // C-05: If email confirmation is required, redirect to verify-email
      // instead of immediately calling the onboard API
      if (data.user && !data.user.email_confirmed_at) {
        router.push('/verify-email');
        return;
      }

      // Email already confirmed (e.g., auto-confirm is on) — provision org
      const onboardRes = await fetch('/api/auth/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: companyName,
          company_slug: slug,
          first_name: firstName,
          last_name: lastName,
        }),
      });

      if (!onboardRes.ok) {
        const body = await onboardRes.json().catch(() => ({ error: 'Setup failed.' }));
        setError(body.error ?? 'Failed to set up your organization.');
        return;
      }

      router.push('/app');
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-background px-8 py-12 shadow-sm">
      <div className="mb-8 text-center">
        <div className="mb-6 inline-flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground">
            <span className="text-xs font-bold text-background">FD</span>
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            FlyteDeck
          </span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Create your account
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          {step === 1
            ? 'Start with your personal details'
            : 'Set up your organization'}
        </p>
      </div>

      {/* Step indicators */}
      <div className="mb-8 flex items-center justify-center gap-3">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
              step >= 1
                ? 'bg-foreground text-background'
                : 'bg-bg-secondary text-text-muted'
            }`}
          >
            1
          </div>
          <span
            className={`text-xs font-medium ${step >= 1 ? 'text-foreground' : 'text-text-muted'}`}
          >
            Account
          </span>
        </div>
        <div className="h-px w-8 bg-bg-tertiary" />
        <div className="flex items-center gap-2">
          <div
            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
              step >= 2
                ? 'bg-foreground text-background'
                : 'bg-bg-secondary text-text-muted'
            }`}
          >
            2
          </div>
          <span
            className={`text-xs font-medium ${step >= 2 ? 'text-foreground' : 'text-text-muted'}`}
          >
            Organization
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {step === 1 && (
        <>
          {/* Social signup */}
          <div className="mb-6 space-y-3">
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={handleGoogleSignup}
              disabled={loading}
              className="w-full"
            >
              <GoogleIcon />
              Continue with Google
            </Button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-3 text-text-muted">or</span>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setStep(2);
            }}
            className="space-y-4"
          >
            <div>
              <label
                htmlFor="fullName"
                className="mb-1.5 block text-sm font-medium text-text-secondary"
              >
                Full name
              </label>
              <FormInput
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Smith"
                required
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-text-secondary"
              >
                Email
              </label>
              <FormInput
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-text-secondary"
              >
                Password
              </label>
              {/* L-02: Password field with show/hide toggle */}
              <div className="relative">
                <FormInput
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-foreground"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {/* L-03: Password strength indicator */}
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          i <= strength.score ? strength.color : 'bg-bg-tertiary'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-text-muted">{strength.label}</p>
                </div>
              )}
            </div>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
            >
              Continue
            </Button>
          </form>
        </>
      )}

      {step === 2 && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="companyName"
              className="mb-1.5 block text-sm font-medium text-text-secondary"
            >
              Company name
            </label>
            <FormInput
              id="companyName"
              type="text"
              value={companyName}
              onChange={(e) => handleCompanyNameChange(e.target.value)}
              placeholder="Acme Productions"
              required
            />
          </div>
          <div>
            <label
              htmlFor="slug"
              className="mb-1.5 block text-sm font-medium text-text-secondary"
            >
              URL slug
            </label>
            <div className="flex items-center rounded-lg border border-border bg-background focus-within:border-foreground focus-within:ring-1 focus-within:ring-foreground">
              <span className="pl-3.5 text-sm text-text-muted">flytedeck.app/</span>
              <FormInput
                id="slug"
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="acme-productions"
                required
                className="w-full rounded-r-lg border-none bg-transparent px-1 py-2.5 text-sm text-foreground placeholder:text-text-muted focus:outline-none"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={() => setStep(1)}
              className="w-full"
            >
              Back
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </Button>
          </div>
        </form>
      )}

      <div className="mt-6 text-center text-xs text-text-muted">
        By creating an account, you agree to our{' '}
        <Link href="/terms" className="underline hover:text-foreground">Terms of Service</Link>
        {' '}and{' '}
        <Link href="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>.
      </div>

      <div className="mt-8 border-t border-border pt-6 text-center text-sm text-text-muted">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-medium text-foreground transition-colors hover:text-text-secondary"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
