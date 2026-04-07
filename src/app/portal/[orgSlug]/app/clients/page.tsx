import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { resolveOrgFromSlug } from '@/lib/auth/resolve-org-from-slug';
import { formatCurrency } from '@/lib/utils';
import ClientsTable from '@/components/admin/clients/ClientsTable';

interface PortalClientsPageProps {
  params: Promise<{ orgSlug: string }>;
}

interface ClientRow {
  id: string;
  company_name: string;
  industry: string | null;
  tags: string[];
  proposals: number;
  total_value: number;
  last_activity: string;
}

async function getClients(orgId: string): Promise<ClientRow[]> {
  try {
    const supabase = await createClient();

    const { data: clients } = await supabase
      .from('clients')
      .select()
      .eq('organization_id', orgId)
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

export default async function PortalClientsPage({ params }: PortalClientsPageProps) {
  const { orgSlug } = await params;
  const org = await resolveOrgFromSlug(orgSlug);
  if (!org) redirect('/');

  const clients = await getClients(org.organizationId);
  const totalValue = clients.reduce((sum, c) => sum + c.total_value, 0);

  return (
    <>
      {/* Header — no create button in portal */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Clients
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {clients.length} clients &middot; {formatCurrency(totalValue)} total pipeline
          </p>
        </div>
      </div>

      <ClientsTable clients={clients} />
    </>
  );
}
