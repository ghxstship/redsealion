import { TierGate } from '@/components/shared/TierGate';
import { formatCurrency } from '@/lib/utils';
import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import EmptyState from '@/components/ui/EmptyState';
import CreditNotesHeader from '@/components/admin/invoices/CreditNotesHeader';
import FinanceHubTabs from '../../../FinanceHubTabs';
import PageHeader from '@/components/shared/PageHeader';

interface CreditNoteRow {
  id: string;
  credit_number: string;
  invoice_number: string;
  amount: number;
  reason: string;
  issued_date: string;
  client_name: string;
}



async function getCreditNotes(): Promise<CreditNoteRow[]> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) throw new Error('No auth');
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('No auth');
const { data: creditNotes } = await supabase
      .from('credit_notes')
      .select('*, invoices(invoice_number), clients(company_name)')
      .eq('organization_id', ctx.organizationId)
      .order('issued_date', { ascending: false });

    if (!creditNotes) throw new Error('No credit notes');

    return creditNotes.map((cn: Record<string, unknown>) => ({
      id: cn.id as string,
      credit_number: cn.credit_number as string,
      invoice_number: (cn.invoices as Record<string, string>)?.invoice_number ?? 'Unknown',
      amount: cn.amount as number,
      reason: (cn.reason as string) ?? '',
      issued_date: cn.issued_date as string,
      client_name: (cn.clients as Record<string, string>)?.company_name ?? 'Unknown',
    }));
  } catch {
    return [];
  }
}

export default async function CreditNotesPage() {
  const creditNotes = await getCreditNotes();

  return (
    <TierGate feature="credit_notes">
<PageHeader
        title="Credit Notes"
        subtitle="Manage credit notes issued against invoices."
      >
        <CreditNotesHeader />
      </PageHeader>

      <FinanceHubTabs />

      <div className="rounded-xl border border-border bg-background divide-y divide-border overflow-x-auto">
        <div className="grid grid-cols-2 gap-4 px-5 py-3 text-xs font-medium uppercase tracking-wider text-text-muted sm:grid-cols-3 lg:grid-cols-6 min-w-[600px] lg:min-w-0">
          <span>Credit #</span>
          <span className="hidden sm:block">Invoice</span>
          <span className="hidden lg:block">Client</span>
          <span>Amount</span>
          <span className="hidden lg:block">Reason</span>
          <span className="hidden sm:block">Issued</span>
        </div>
        {creditNotes.map((cn) => (
          <div key={cn.id} className="grid grid-cols-2 gap-4 px-5 py-3 items-center sm:grid-cols-3 lg:grid-cols-6 min-w-[600px] lg:min-w-0">
            <span className="text-sm font-medium text-foreground">{cn.credit_number}</span>
            <span className="text-sm text-text-secondary hidden sm:block">{cn.invoice_number}</span>
            <span className="text-sm text-text-secondary hidden lg:block">{cn.client_name}</span>
            <span className="text-sm font-medium text-red-600">-{formatCurrency(cn.amount)}</span>
            <span className="text-sm text-text-secondary truncate hidden lg:block">{cn.reason}</span>
            <span className="text-sm text-text-muted hidden sm:block">{cn.issued_date}</span>
          </div>
        ))}
      </div>

      {creditNotes.length === 0 && (
        <EmptyState
          message="No credit notes yet"
          description="Issue credit notes for refunds or invoice adjustments."
        />
      )}
    </TierGate>
  );
}
