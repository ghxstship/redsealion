'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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

  function handleCompanyNameChange(value: string) {
    setCompanyName(value);
    setSlug(generateSlug(value));
  }

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
          One last step — tell us about your company
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

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
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Setting up...' : 'Continue to Dashboard'}
        </button>
      </form>
    </div>
  );
}
