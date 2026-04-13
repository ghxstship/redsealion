import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { formatCurrency , formatDate } from '@/lib/utils';
import Link from 'next/link';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge, { INVOICE_STATUS_COLORS } from '@/components/ui/StatusBadge';
import InvoiceHubTabs from '../InvoiceHubTabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

import { RoleGate } from '@/components/shared/RoleGate';
interface InvoiceRow {
  id: string;
  invoice_number: string;
  type: string;
  status: string;
  issue_date: string;
  due_date: string;
  total: number;
  amount_paid: number;
  client_name: string;
}



async function getInvoices(): Promise<InvoiceRow[]> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return [];

    const { data } = await supabase
      .from('invoices')
      .select('id, invoice_number, type, status, issue_date, due_date, total, amount_paid, client_id')
      .eq('organization_id', ctx.organizationId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!data || data.length === 0) return [];

    const clientIds = [...new Set(data.map((i) => i.client_id).filter(Boolean))];
    const { data: clients } = clientIds.length
      ? await supabase.from('clients').select('id, company_name').in('id', clientIds)
      : { data: [] };

    const nameMap = new Map((clients ?? []).map((c) => [c.id, c.company_name]));

    return data.map((inv) => ({
      id: inv.id,
      invoice_number: inv.invoice_number,
      type: inv.type ?? 'standard',
      status: inv.status,
      issue_date: inv.issue_date,
      due_date: inv.due_date,
      total: inv.total,
      amount_paid: inv.amount_paid ?? 0,
      client_name: nameMap.get(inv.client_id) ?? '—',
    }));
  } catch {
    return [];
  }
}

export default async function InvoicesPage() {
  const invoices = await getInvoices();
  const totalOutstanding = invoices.reduce((s, i) => s + (i.total - i.amount_paid), 0);

  return (
    <RoleGate resource="invoices">
    <>
      <PageHeader
        title="Invoices"
        subtitle={`${invoices.length} invoices · ${formatCurrency(totalOutstanding)} outstanding`}
      >
        <Link
          href="/app/invoices/new"
          className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 transition-opacity"
        >
          New Invoice
        </Link>
      </PageHeader>

      <InvoiceHubTabs />

      {invoices.length === 0 ? (
        <EmptyState
          message="No invoices yet"
          description="Create your first invoice to start tracking payments."
          action={
            <Link
              href="/app/invoices/new"
              className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              New Invoice
            </Link>
          }
        />
      ) : (
        <div className="rounded-xl border border-border bg-background overflow-hidden">
          <div className="overflow-x-auto">
            <Table >
              <TableHeader >
                <TableRow>
                  <TableHead className="px-4 py-3">Invoice #</TableHead>
                  <TableHead className="px-4 py-3">Client</TableHead>
                  <TableHead className="px-4 py-3">Type</TableHead>
                  <TableHead className="px-4 py-3">Issued</TableHead>
                  <TableHead className="px-4 py-3">Due</TableHead>
                  <TableHead className="px-4 py-3 text-right">Total</TableHead>
                  <TableHead className="px-4 py-3 text-right">Paid</TableHead>
                  <TableHead className="px-4 py-3">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody >
                {invoices.map((inv) => (
                  <TableRow key={inv.id} className="hover:bg-bg-secondary/50 transition-colors">
                    <TableCell className="px-4 py-3">
                      <Link href={`/app/invoices/${inv.id}`} className="font-medium text-foreground hover:underline">
                        {inv.invoice_number}
                      </Link>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-text-secondary">{inv.client_name}</TableCell>
                    <TableCell className="px-4 py-3 capitalize">{inv.type}</TableCell>
                    <TableCell className="px-4 py-3 text-text-secondary">{formatDate(inv.issue_date)}</TableCell>
                    <TableCell className="px-4 py-3 text-text-secondary">{formatDate(inv.due_date)}</TableCell>
                    <TableCell className="px-4 py-3 text-right tabular-nums">{formatCurrency(inv.total)}</TableCell>
                    <TableCell className="px-4 py-3 text-right tabular-nums">{formatCurrency(inv.amount_paid)}</TableCell>
                    <TableCell className="px-4 py-3">
                      <StatusBadge status={inv.status} colorMap={INVOICE_STATUS_COLORS} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </>
  </RoleGate>
  );
}
