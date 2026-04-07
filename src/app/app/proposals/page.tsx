import ProposalsTable from '@/components/admin/proposals/ProposalsTable';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';

type Proposal = Database['public']['Tables']['proposals']['Row'];
type Client = Database['public']['Tables']['clients']['Row'];

async function getData(): Promise<{ proposals: Proposal[]; clients: Client[] }> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) throw new Error('No auth');
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { proposals: [], clients: [] };
const { data: proposals } = await supabase
      .from('proposals')
      .select()
      .eq('organization_id', ctx.organizationId)
      .order('created_at', { ascending: false });

    const { data: clients } = await supabase
      .from('clients')
      .select()
      .eq('organization_id', ctx.organizationId);

    return {
      proposals: (proposals ?? []) as Proposal[],
      clients: (clients ?? []) as Client[],
    };
  } catch {
    return { proposals: [], clients: [] };
  }
}

export default async function ProposalsPage() {
  const { proposals, clients } = await getData();

  return <ProposalsTable proposals={proposals} clients={clients} />;
}
