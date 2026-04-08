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
      .select()
      .eq('organization_id', ctx.organizationId)
      .order('company_name');

    if (!clients) return [];

    return clients.map((c: Record<string, unknown>) => ({
      id: c.id as string,
      company_name: c.company_name as string,
      industry: c.industry as string | null,
      tags: (c.tags as string[]) ?? [],
      proposals: 0,
      total_value: 0,
      last_activity: c.updated_at as string,
    }));
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
