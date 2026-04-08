'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Step 1: Account
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Step 2: Organization
  const [companyName, setCompanyName] = useState('');
  const [slug, setSlug] = useState('');

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
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            company_name: companyName,
            company_slug: slug,
          },
        },
      });

      if (error) {
        setError(error.message);
        return;
      }

      // Provision organization + membership
      const onboardRes = await fetch('/api/auth/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: companyName,
          company_slug: slug,
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
          Create your account
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
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
                ? 'bg-zinc-900 text-white'
                : 'bg-zinc-100 text-zinc-400'
            }`}
          >
            1
          </div>
          <span
            className={`text-xs font-medium ${step >= 1 ? 'text-zinc-900' : 'text-zinc-400'}`}
          >
            Account
          </span>
        </div>
        <div className="h-px w-8 bg-zinc-200" />
        <div className="flex items-center gap-2">
          <div
            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
              step >= 2
                ? 'bg-zinc-900 text-white'
                : 'bg-zinc-100 text-zinc-400'
            }`}
          >
            2
          </div>
          <span
            className={`text-xs font-medium ${step >= 2 ? 'text-zinc-900' : 'text-zinc-400'}`}
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
            <button
              type="button"
              onClick={handleGoogleSignup}
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
            onSubmit={(e) => {
              e.preventDefault();
              setStep(2);
            }}
            className="space-y-4"
          >
            <div>
              <label
                htmlFor="fullName"
                className="mb-1.5 block text-sm font-medium text-zinc-700"
              >
                Full name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Smith"
                required
                className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              />
            </div>
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
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-zinc-700"
              >
                Password
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
            <button
              type="submit"
              className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
            >
              Continue
            </button>
          </form>
        </>
      )}

      {step === 2 && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="companyName"
              className="mb-1.5 block text-sm font-medium text-zinc-700"
            >
              Company name
            </label>
            <input
              id="companyName"
              type="text"
              value={companyName}
              onChange={(e) => handleCompanyNameChange(e.target.value)}
              placeholder="Acme Productions"
              required
              className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            />
          </div>
          <div>
            <label
              htmlFor="slug"
              className="mb-1.5 block text-sm font-medium text-zinc-700"
            >
              URL slug
            </label>
            <div className="flex items-center rounded-lg border border-zinc-300 bg-white focus-within:border-zinc-500 focus-within:ring-1 focus-within:ring-zinc-500">
              <span className="pl-3.5 text-sm text-zinc-400">flytedeck.app/</span>
              <input
                id="slug"
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="acme-productions"
                required
                className="w-full rounded-r-lg border-none bg-transparent px-1 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 text-center text-xs text-zinc-500">
        By creating an account, you agree to our{' '}
        <Link href="/terms" className="underline hover:text-zinc-900">Terms of Service</Link>
        {' '}and{' '}
        <Link href="/privacy" className="underline hover:text-zinc-900">Privacy Policy</Link>.
      </div>

      <div className="mt-8 border-t border-zinc-100 pt-6 text-center text-sm text-zinc-500">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-medium text-zinc-900 transition-colors hover:text-zinc-700"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
