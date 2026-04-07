import Link from 'next/link';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import InvoiceForm from '@/components/admin/invoices/InvoiceForm';
import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';

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
    const ctx = await resolveCurrentOrg();
    if (!ctx) throw new Error('No auth');
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('No auth');
const { data: clients } = await supabase
      .from('clients')
      .select('id, company_name')
      .eq('organization_id', ctx.organizationId)
      .order('company_name');

    const { data: proposals } = await supabase
      .from('proposals')
      .select('id, name')
      .eq('organization_id', ctx.organizationId)
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
    return { clients: [], proposals: [] };
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

      <PageHeader title="Create Invoice" />

      <InvoiceForm clients={clients} proposals={proposals} />
    </TierGate>
  );
}
