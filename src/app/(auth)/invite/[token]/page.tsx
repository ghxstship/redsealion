'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import Skeleton from '@/components/ui/Skeleton';

interface InvitationInfo {
  id: string;
  organization_name: string;
  scope_type: string;
  role_name: string;
  invited_email: string;
  expires_at: string;
  personal_message?: string;
}

/**
 * H-10: Invitation acceptance landing page.
 *
 * When an invited user clicks the link in their email, they land here.
 * If authenticated and email matches, they can accept. If not authenticated,
 * they are prompted to sign in or sign up first.
 */
export default function InviteAcceptPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<InvitationInfo | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    async function loadInvitation() {
      try {
        // Check auth status
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          setAuthenticated(true);
          setUserEmail(user.email ?? null);
        }

        // Fetch invitation details
        const res = await fetch(`/api/v1/invitations/${token}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          if (res.status === 404) {
            setError('This invitation link is invalid or has expired.');
          } else {
            setError(body.error ?? 'Failed to load invitation.');
          }
          return;
        }

        const data = await res.json();
        setInvitation(data);

        // Check if expired
        if (data.expires_at && new Date(data.expires_at) < new Date()) {
          setError('This invitation has expired. Please ask for a new one.');
        }
      } catch {
        setError('Failed to load invitation details.');
      } finally {
        setLoading(false);
      }
    }

    loadInvitation();
  }, [token]);

  async function handleAccept() {
    setAccepting(true);
    setError(null);

    try {
      const res = await fetch(`/api/v1/invitations/${token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept' }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? 'Failed to accept invitation.');
        return;
      }

      // Redirect to app
      router.push('/app');
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setAccepting(false);
    }
  }

  if (loading) {
    return <Skeleton height="h-[300px]" className="rounded-2xl border border-zinc-200" />;
  }

  if (error && !invitation) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white px-8 py-12 shadow-sm text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-zinc-900">Invalid Invitation</h1>
        <p className="mt-2 text-sm text-zinc-500">{error}</p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
        >
          Go to Sign In
        </Link>
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
          You&apos;re invited!
        </h1>
        {invitation && (
          <p className="mt-2 text-sm text-zinc-500">
            You&apos;ve been invited to join <span className="font-medium text-zinc-700">{invitation.organization_name}</span> as a <span className="font-medium text-zinc-700">{invitation.role_name}</span>.
          </p>
        )}
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {invitation?.personal_message && (
        <div className="mb-6 rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-3 text-sm text-zinc-600 italic">
          &ldquo;{invitation.personal_message}&rdquo;
        </div>
      )}

      {authenticated ? (
        <div className="space-y-4">
          {userEmail && userEmail !== invitation?.invited_email && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              This invitation was sent to <span className="font-medium">{invitation?.invited_email}</span>, but you&apos;re signed in as <span className="font-medium">{userEmail}</span>. You may need to sign in with the correct account.
            </div>
          )}

          <button
            onClick={handleAccept}
            disabled={accepting}
            className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {accepting ? 'Accepting...' : 'Accept Invitation'}
          </button>

          <Link
            href="/app"
            className="block w-full text-center text-sm text-zinc-500 transition-colors hover:text-zinc-900"
          >
            Go to Dashboard
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-zinc-500 text-center">
            Sign in or create an account to accept this invitation.
          </p>

          <Link
            href={`/login?redirect=${encodeURIComponent(`/invite/${token}`)}`}
            className="block w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-zinc-800"
          >
            Sign In
          </Link>

          <Link
            href="/signup"
            className="block w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-center text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            Create Account
          </Link>
        </div>
      )}
    </div>
  );
}
