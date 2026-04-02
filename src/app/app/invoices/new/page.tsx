import Link from 'next/link';
import { TierGate } from '@/components/shared/TierGate';
import InvoiceForm from '@/components/admin/invoices/InvoiceForm';
import { createClient } from '@/lib/supabase/server';
import { getSeedClients, getSeedProposals } from '@/lib/seed-data';

interface SelectOption {
  id: string;
  label: string;
}

async function getOptions(): Promise<{
  clients: SelectOption[];
  proposals: SelectOption[];
}> {
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

    const { data: clients } = await supabase
      .from('clients')
      .select('id, company_name')
      .eq('organization_id', userData.organization_id)
      .order('company_name');

    const { data: proposals } = await supabase
      .from('proposals')
      .select('id, name')
      .eq('organization_id', userData.organization_id)
      .order('name');

    return {
      clients: (clients ?? []).map((c: Record<string, unknown>) => ({
        id: c.id as string,
        label: c.company_name as string,
      })),
      proposals: (proposals ?? []).map((p: Record<string, unknown>) => ({
        id: p.id as string,
        label: p.name as string,
      })),
    };
  } catch {
    return {
      clients: getSeedClients().map((c) => ({
        id: c.id,
        label: c.company_name,
      })),
      proposals: getSeedProposals().map((p) => ({
        id: p.id,
        label: p.name,
      })),
    };
  }
}

export default async function NewInvoicePage() {
  const { clients, proposals } = await getOptions();

  return (
    <TierGate feature="invoices">
      <nav className="mb-6 flex items-center gap-2 text-sm text-text-muted">
        <Link href="/app/invoices" className="hover:text-foreground transition-colors">
          Invoices
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">New Invoice</span>
      </nav>

      <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-8">
        Create Invoice
      </h1>

      <InvoiceForm clients={clients} proposals={proposals} />
    </TierGate>
  );
}
