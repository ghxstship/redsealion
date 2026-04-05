import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { resolveOrgFromSlug } from '@/lib/auth/resolve-org-from-slug';
import ProposalsClient from '@/components/admin/proposals/ProposalsClient';
import type { Proposal, Client } from '@/types/database';

interface PortalProposalsPageProps {
  params: Promise<{ orgSlug: string }>;
}

async function getData(orgId: string): Promise<{ proposals: Proposal[]; clients: Client[] }> {
  try {
    const supabase = await createClient();

    const { data: proposals } = await supabase
      .from('proposals')
      .select()
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    const { data: clients } = await supabase
      .from('clients')
      .select()
      .eq('organization_id', orgId);

    return {
      proposals: (proposals ?? []) as Proposal[],
      clients: (clients ?? []) as Client[],
    };
  } catch {
    return { proposals: [], clients: [] };
  }
}

export default async function PortalProposalsPage({ params }: PortalProposalsPageProps) {
  const { orgSlug } = await params;
  const org = await resolveOrgFromSlug(orgSlug);
  if (!org) redirect('/');

  const { proposals, clients } = await getData(org.organizationId);

  return <ProposalsClient proposals={proposals} clients={clients} />;
}
