import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { createClient } from '@/lib/supabase/server';
import ClientsSearch from '@/components/admin/clients/ClientsSearch';

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
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!userData) return [];

    const { data: clients } = await supabase
      .from('clients')
      .select()
      .eq('organization_id', userData.organization_id)
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
        <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-foreground/90">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <line x1="8" y1="2" x2="8" y2="14" />
            <line x1="2" y1="8" x2="14" y2="8" />
          </svg>
          Add Client
        </button>
      </div>

      {/* Search */}
      <ClientsSearch clients={clients} />
    </>
  );
}
