import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { createClient } from '@/lib/supabase/server';
import ClientsTable from '@/components/admin/clients/ClientsTable';
import ClientsHeader from '@/components/admin/clients/ClientsHeader';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import PageHeader from '@/components/shared/PageHeader';
import ClientsHubTabs from '../ClientsHubTabs';

interface ClientRow {
  id: string;
  company_name: string;
  industry: string | null;
  tags: string[];
  proposals: number;
  total_value: number;
  last_activity: string;
}

async function getClients(): Promise<ClientRow[]> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return [];

    const { data: clients } = await supabase
      .from('clients')
      .select('id, company_name, industry, tags, updated_at, proposals(id, total_value)')
      .eq('organization_id', ctx.organizationId)
      .is('deleted_at', null)
      .order('company_name')
      .limit(500);

    if (!clients) return [];

    return clients.map((c: Record<string, unknown>) => {
      const proposals = (c.proposals ?? []) as Array<{ id: string; total_value: number }>;
      return {
        id: c.id as string,
        company_name: c.company_name as string,
        industry: c.industry as string | null,
        tags: (c.tags as string[]) ?? [],
        proposals: proposals.length,
        total_value: proposals.reduce((sum, p) => sum + (p.total_value ?? 0), 0),
        last_activity: c.updated_at as string,
      };
    });
  } catch {
    return [];
  }
}

export default async function ClientsPage() {
  const clients = await getClients();
  const totalValue = clients.reduce((sum, c) => sum + c.total_value, 0);

  return (
    <>
<PageHeader
        title="Clients"
        subtitle={`${clients.length} clients · ${formatCurrency(totalValue)} total pipeline`}
      >
        <ClientsHeader />
      </PageHeader>

      <ClientsHubTabs />

      <ClientsTable clients={clients} />
    </>
  );
}
