import { createClient } from '@/lib/supabase/server';

interface EsignRequest {
  id: string;
  document_title: string;
  signer_name: string;
  signer_email: string;
  status: string;
  org_name: string;
  created_at: string;
}

async function getEsignRequest(
  orgSlug: string,
  token: string
): Promise<{ data: EsignRequest | null; error: string | null }> {
  try {
    const supabase = await createClient();

    // Verify org
    const { data: org } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('slug', orgSlug)
      .single();

    if (!org) {
      return { data: null, error: 'Organization not found.' };
    }

    // Fetch e-sign request by token
    const { data: request } = await supabase
      .from('esign_requests')
      .select('*')
      .eq('token', token)
      .eq('organization_id', org.id)
      .single();

    if (!request) {
      return { data: null, error: 'This signing link is invalid or has expired.' };
    }

    if (request.status === 'signed') {
      return { data: null, error: 'This document has already been signed.' };
    }

    return {
      data: {
        id: request.id,
        document_title: request.document_title,
        signer_name: request.signer_name,
        signer_email: request.signer_email,
        status: request.status,
        org_name: org.name,
        created_at: request.created_at,
      },
      error: null,
    };
  } catch {
    // Fallback for demo
    return {
      data: {
        id: 'esign_001',
        document_title: 'Nike SNKRS Fest 2026 - Production Agreement',
        signer_name: 'Sarah Chen',
        signer_email: 'sarah.chen@nike.com',
        status: 'pending',
        org_name: orgSlug
          .split('-')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' '),
        created_at: '2026-03-28',
      },
      error: null,
    };
  }
}

export default async function EsignPage({
  params,
}: {
  params: Promise<{ orgSlug: string; token: string }>;
}) {
  const { orgSlug, token } = await params;
  const { data: request, error } = await getEsignRequest(orgSlug, token);

  // Error state
  if (error || !request) {
    return (
      <div className="min-h-screen bg-bg-secondary flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-xl border border-border bg-white p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-red-500"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-foreground">Unable to Load Document</h1>
          <p className="mt-2 text-sm text-text-secondary">
            {error ?? 'This signing link is invalid or has expired.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-secondary flex flex-col items-center p-6">
      {/* Header */}
      <div className="w-full max-w-2xl mb-8">
        <p className="text-sm text-text-muted text-center">{request.org_name}</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground text-center">
          {request.document_title}
        </h1>
      </div>

      {/* Document info */}
      <div className="w-full max-w-2xl rounded-xl border border-border bg-white p-6 mb-6">
        <h2 className="text-sm font-semibold text-foreground mb-4">Signer Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-text-muted">Name</p>
            <p className="text-sm font-medium text-foreground">{request.signer_name}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Email</p>
            <p className="text-sm text-foreground">{request.signer_email}</p>
          </div>
        </div>
      </div>

      {/* Signature canvas placeholder */}
      <div className="w-full max-w-2xl rounded-xl border border-border bg-white p-6 mb-6">
        <h2 className="text-sm font-semibold text-foreground mb-4">Your Signature</h2>
        <div className="rounded-lg border-2 border-dashed border-border bg-bg-secondary/50 h-40 flex items-center justify-center">
          <p className="text-sm text-text-muted">
            Draw your signature here
          </p>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <button className="text-xs font-medium text-text-muted hover:text-foreground transition-colors">
            Clear
          </button>
          <p className="text-xs text-text-muted">
            By signing, you agree to the terms of this document.
          </p>
        </div>
      </div>

      {/* Submit */}
      <div className="w-full max-w-2xl">
        <form action={`/api/esign/complete`} method="POST">
          <input type="hidden" name="token" value={token} />
          <input type="hidden" name="orgSlug" value={orgSlug} />
          <button
            type="submit"
            className="w-full rounded-lg bg-foreground px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-foreground/90"
          >
            Sign Document
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-text-muted">
          Powered by FlyteDeck &middot; Secure electronic signature
        </p>
      </div>
    </div>
  );
}
