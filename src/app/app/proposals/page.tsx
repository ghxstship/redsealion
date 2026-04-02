import ProposalsClient from '@/components/admin/proposals/ProposalsClient';
import { createClient } from '@/lib/supabase/server';
import { getSeedProposals, getSeedClients } from '@/lib/seed-data';
import type { Proposal, Client } from '@/types/database';

async function getData(): Promise<{ proposals: Proposal[]; clients: Client[] }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('No auth');

    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!userData) throw new Error('No org');

    const { data: proposals } = await supabase
      .from('proposals')
      .select('*')
      .eq('organization_id', userData.organization_id)
      .order('created_at', { ascending: false });

    const { data: clients } = await supabase
      .from('clients')
      .select('*')
      .eq('organization_id', userData.organization_id);

    if (!proposals || !clients) throw new Error('No data');

    return {
      proposals: proposals as Proposal[],
      clients: clients as Client[],
    };
  } catch {
    return {
      proposals: getSeedProposals(),
      clients: getSeedClients(),
    };
  }
}

export default async function ProposalsPage() {
  const { proposals, clients } = await getData();

  return <ProposalsClient proposals={proposals} clients={clients} />;
}
