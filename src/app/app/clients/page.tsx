import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { createClient } from '@/lib/supabase/server';
import ClientsTable from '@/components/admin/clients/ClientsTable';
import ClientsHeader from '@/components/admin/clients/ClientsHeader';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';

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
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Clients
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {clients.length} clients &middot; {formatCurrency(totalValue)} total pipeline
          </p>
        </div>
        <ClientsHeader />
      </div>

      <ClientsTable clients={clients} />
    </>
  );
}
