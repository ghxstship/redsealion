import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PackingClient from './PackingClient';

interface Proposal {
  id: string;
  name: string;
  client_name: string;
}

async function getProposals(): Promise<Proposal[]> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) throw new Error('No auth');
    
    // Simple fetch directly without unneeded auth check since auth is guaranteed by layout/middleware
    const { data: proposals } = await supabase
      .from('proposals')
      .select('id, name, clients(company_name)')
      .eq('organization_id', ctx.organizationId)
      .in('status', ['approved', 'in_production', 'sent', 'won'])
      .order('name');

    if (!proposals) return [];

    return proposals.map((p: Record<string, unknown>) => ({
      id: p.id as string,
      name: p.name as string,
      client_name: (p.clients as Record<string, string>)?.company_name ?? 'Unknown',
    }));
  } catch {
    return [];
  }
}

export default async function PackingPage() {
  const proposals = await getProposals();

  return (
    <TierGate feature="warehouse">
      <PackingClient proposals={proposals} />
    </TierGate>
  );
}
