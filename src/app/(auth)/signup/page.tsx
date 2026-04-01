'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

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
            <span className="text-sm font-bold text-white">X</span>
          </div>
          <span className="text-lg font-semibold tracking-tight text-zinc-900">
            XPB
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
              <span className="pl-3.5 text-sm text-zinc-400">xpb.app/</span>
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
