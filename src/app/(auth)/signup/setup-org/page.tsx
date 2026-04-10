'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Post-OAuth organization setup page.
 *
 * Rendered when a user signs up via Google OAuth and has no active
 * organization membership. Collects company name/slug and calls
 * the onboard API to provision the org + membership.
 */
export default function SetupOrgPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [slug, setSlug] = useState('');

  // H-06: Name fields for OAuth users (pre-populated from auth metadata)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nameLoaded, setNameLoaded] = useState(false);

  // H-09: Slug availability state
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

  // H-06: Pre-populate name from OAuth metadata
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        const meta = data.user.user_metadata;
        setFirstName(meta?.given_name ?? meta?.first_name ?? '');
        setLastName(meta?.family_name ?? meta?.last_name ?? '');
      }
      setNameLoaded(true);
    });
  }, []);

  function handleCompanyNameChange(value: string) {
    setCompanyName(value);
    const newSlug = generateSlug(value);
    setSlug(newSlug);
    setSlugStatus('idle');
  }

  // H-09: Debounced slug availability check
  const checkSlugAvailability = useCallback(async (slugToCheck: string) => {
    if (slugToCheck.length < 2) {
      setSlugStatus('idle');
      return;
    }
    setSlugStatus('checking');
    try {
      const res = await fetch(`/api/auth/check-slug?slug=${encodeURIComponent(slugToCheck)}`);
      if (res.ok) {
        const data = await res.json();
        setSlugStatus(data.available ? 'available' : 'taken');
      } else {
        setSlugStatus('idle');
      }
    } catch {
      setSlugStatus('idle');
    }
  }, []);

  useEffect(() => {
    if (slug.length < 2) {
      setSlugStatus('idle');
      return;
    }
    const timer = setTimeout(() => checkSlugAvailability(slug), 500);
    return () => clearTimeout(timer);
  }, [slug, checkSlugAvailability]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: companyName,
          company_slug: slug,
          first_name: firstName,
          last_name: lastName,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Setup failed.' }));
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
          Set up your organization
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          One last step — tell us about yourself and your company
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* H-06: Name fields for OAuth users */}
        {nameLoaded && (
          <div className="flex gap-3">
            <div className="flex-1">
              <label
                htmlFor="firstName"
                className="mb-1.5 block text-sm font-medium text-zinc-700"
              >
                First name
              </label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jane"
                required
                className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              />
            </div>
            <div className="flex-1">
              <label
                htmlFor="lastName"
                className="mb-1.5 block text-sm font-medium text-zinc-700"
              >
                Last name
              </label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Smith"
                required
                className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              />
            </div>
          </div>
        )}

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
          <div className={`flex items-center rounded-lg border bg-white focus-within:ring-1 ${
            slugStatus === 'taken'
              ? 'border-red-300 focus-within:border-red-500 focus-within:ring-red-500'
              : slugStatus === 'available'
                ? 'border-emerald-300 focus-within:border-emerald-500 focus-within:ring-emerald-500'
                : 'border-zinc-300 focus-within:border-zinc-500 focus-within:ring-zinc-500'
          }`}>
            <span className="pl-3.5 text-sm text-zinc-400">flytedeck.app/</span>
            <input
              id="slug"
              type="text"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugStatus('idle');
              }}
              placeholder="acme-productions"
              required
              className="w-full rounded-r-lg border-none bg-transparent px-1 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
            />
            {/* H-09: Slug availability indicator */}
            {slugStatus === 'checking' && (
              <span className="pr-3 text-xs text-zinc-400">Checking…</span>
            )}
            {slugStatus === 'available' && (
              <span className="pr-3 text-xs text-emerald-600">✓</span>
            )}
            {slugStatus === 'taken' && (
              <span className="pr-3 text-xs text-red-600">Taken</span>
            )}
          </div>
          {slugStatus === 'taken' && (
            <p className="mt-1 text-xs text-red-600">This slug is already in use. Please choose another.</p>
          )}
        </div>
        <button
          type="submit"
          disabled={loading || slugStatus === 'taken'}
          className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Setting up...' : 'Continue to Dashboard'}
        </button>
      </form>
    </div>
  );
}
