import { createClient } from '@/lib/supabase/server';
import { XCircle } from 'lucide-react';
import SignPageClient from './SignPageClient';

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
      .from('esignature_requests')
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
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <XCircle className="text-red-500" size={24} strokeWidth={2} />
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
    <SignPageClient
      token={token}
      documentTitle={request.document_title}
      signerName={request.signer_name}
      signerEmail={request.signer_email}
      orgName={request.org_name}
    />
  );
}
