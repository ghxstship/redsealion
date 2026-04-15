import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { TierGate } from '@/components/shared/TierGate';
import { formatCurrency } from '@/lib/utils';
import PageHeader from '@/components/shared/PageHeader';
import ReportsHubTabs from '../../ReportsHubTabs';
import Card from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import { Download } from 'lucide-react';

interface AgingRow {
  clientName: string;
  clientId: string;
  current: number;
  d1_30: number;
  d31_60: number;
  d61_90: number;
  d90plus: number;
  total: number;
  invoiceCount: number;
}

interface AgingBuckets {
  current: number;
  d1_30: number;
  d31_60: number;
  d61_90: number;
  d90plus: number;
}

function getBucket(dueDate: string, asOf: Date): keyof AgingBuckets {
  const daysOverdue = Math.floor(
    (asOf.getTime() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24),
  );
  if (daysOverdue <= 0) return 'current';
  if (daysOverdue <= 30) return 'd1_30';
  if (daysOverdue <= 60) return 'd31_60';
  if (daysOverdue <= 90) return 'd61_90';
  return 'd90plus';
}

async function getAgingData(): Promise<{ rows: AgingRow[]; totals: AgingBuckets & { total: number } }> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) throw new Error('No auth');

    const { data: invoices } = await supabase
      .from('invoices')
      .select('client_id, due_date, total, amount_paid, status, clients(company_name)')
      .eq('organization_id', ctx.organizationId)
      .in('status', ['sent', 'overdue', 'partially_paid']);

    if (!invoices || invoices.length === 0) {
      return { rows: [], totals: { current: 0, d1_30: 0, d31_60: 0, d61_90: 0, d90plus: 0, total: 0 } };
    }

    const now = new Date();
    const clientMap = new Map<string, AgingRow>();

    for (const inv of invoices as Array<Record<string, unknown>>) {
      const balance = ((inv.total as number) ?? 0) - ((inv.amount_paid as number) ?? 0);
      if (balance <= 0) continue;

      const bucket = getBucket((inv.due_date as string) ?? '', now);
      const clientId = (inv.client_id as string) ?? 'unknown';
      const clientData = inv.clients as Record<string, string> | undefined;
      const clientName = clientData?.company_name ?? 'Unknown Client';

      const existing = clientMap.get(clientId) ?? {
        clientName,
        clientId,
        current: 0,
        d1_30: 0,
        d31_60: 0,
        d61_90: 0,
        d90plus: 0,
        total: 0,
        invoiceCount: 0,
      };

      existing[bucket] += balance;
      existing.total += balance;
      existing.invoiceCount += 1;
      clientMap.set(clientId, existing);
    }

    const rows = Array.from(clientMap.values()).sort((a, b) => b.total - a.total);
    const totals = rows.reduce(
      (acc, r) => ({
        current: acc.current + r.current,
        d1_30: acc.d1_30 + r.d1_30,
        d31_60: acc.d31_60 + r.d31_60,
        d61_90: acc.d61_90 + r.d61_90,
        d90plus: acc.d90plus + r.d90plus,
        total: acc.total + r.total,
      }),
      { current: 0, d1_30: 0, d31_60: 0, d61_90: 0, d90plus: 0, total: 0 },
    );

    return { rows, totals };
  } catch {
    return { rows: [], totals: { current: 0, d1_30: 0, d31_60: 0, d61_90: 0, d90plus: 0, total: 0 } };
  }
}

function bucketColor(value: number, total: number): string {
  if (total === 0) return 'bg-bg-secondary';
  const pct = (value / total) * 100;
  if (pct >= 30) return 'bg-red-500';
  if (pct >= 15) return 'bg-orange-500';
  return 'bg-green-500';
}

export default async function ArAgingReportPage() {
  const { rows, totals } = await getAgingData();
  const asOfDate = new Date().toISOString().split('T')[0];

  return (
    <TierGate feature="reports">
      <nav className="mb-6 flex items-center gap-2 text-sm text-text-muted">
        <Link href="/app/reports" className="hover:text-foreground transition-colors">
          Reports
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">AR Aging</span>
      </nav>

      <div className="flex items-center justify-between mb-2">
        <PageHeader title="Accounts Receivable Aging" subtitle={`Outstanding balances as of ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`} />
        <Link href={`/api/documents/ar-aging?asOfDate=${asOfDate}`}>
          <Button variant="secondary" size="sm">
            <Download size={14} className="mr-1.5" />
            Export DOCX
          </Button>
        </Link>
      </div>

      <ReportsHubTabs />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6 mb-8">
        <Card padding="default" className="px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Total AR</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{formatCurrency(totals.total)}</p>
        </Card>
        <Card padding="default" className="px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Current</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-green-600">{formatCurrency(totals.current)}</p>
        </Card>
        <Card padding="default" className="px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">1-30 Days</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-yellow-600">{formatCurrency(totals.d1_30)}</p>
        </Card>
        <Card padding="default" className="px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">31-60 Days</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-orange-600">{formatCurrency(totals.d31_60)}</p>
        </Card>
        <Card padding="default" className="px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">61-90 Days</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-red-600">{formatCurrency(totals.d61_90)}</p>
        </Card>
        <Card padding="default" className="px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">90+ Days</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-red-800">{formatCurrency(totals.d90plus)}</p>
        </Card>
      </div>

      {/* Stacked bar visualization */}
      {totals.total > 0 && (
        <Card padding="default" className="px-6 py-5 mb-8">
          <h3 className="text-sm font-semibold text-foreground mb-4">Aging Distribution</h3>
          <div className="flex h-6 rounded-lg overflow-hidden gap-0.5">
            {totals.current > 0 && (
              <div
                className="bg-green-500 transition-all"
                style={{ width: `${(totals.current / totals.total) * 100}%` }}
                title={`Current: ${formatCurrency(totals.current)}`}
              />
            )}
            {totals.d1_30 > 0 && (
              <div
                className="bg-yellow-500 transition-all"
                style={{ width: `${(totals.d1_30 / totals.total) * 100}%` }}
                title={`1-30 Days: ${formatCurrency(totals.d1_30)}`}
              />
            )}
            {totals.d31_60 > 0 && (
              <div
                className="bg-orange-500 transition-all"
                style={{ width: `${(totals.d31_60 / totals.total) * 100}%` }}
                title={`31-60 Days: ${formatCurrency(totals.d31_60)}`}
              />
            )}
            {totals.d61_90 > 0 && (
              <div
                className="bg-red-500 transition-all"
                style={{ width: `${(totals.d61_90 / totals.total) * 100}%` }}
                title={`61-90 Days: ${formatCurrency(totals.d61_90)}`}
              />
            )}
            {totals.d90plus > 0 && (
              <div
                className="bg-red-800 transition-all"
                style={{ width: `${(totals.d90plus / totals.total) * 100}%` }}
                title={`90+ Days: ${formatCurrency(totals.d90plus)}`}
              />
            )}
          </div>
          <div className="flex gap-4 mt-3 text-xs text-text-muted">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-green-500" /><span>Current</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-yellow-500" /><span>1-30</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-orange-500" /><span>31-60</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-500" /><span>61-90</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-800" /><span>90+</span></div>
          </div>
        </Card>
      )}

      {/* Client Breakdown Table */}
      {rows.length === 0 ? (
        <div className="rounded-xl border border-border bg-background px-8 py-16 text-center">
          <p className="text-sm text-text-secondary">No outstanding receivables.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-background overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border bg-bg-secondary">
                  <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Client</TableHead>
                  <TableHead className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Current</TableHead>
                  <TableHead className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">1-30</TableHead>
                  <TableHead className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">31-60</TableHead>
                  <TableHead className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">61-90</TableHead>
                  <TableHead className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">90+</TableHead>
                  <TableHead className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Total</TableHead>
                  <TableHead className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-text-muted">Inv.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.clientId} className="transition-colors hover:bg-bg-secondary/50">
                    <TableCell className="px-6 py-3.5 text-sm font-medium text-foreground">{r.clientName}</TableCell>
                    <TableCell className="px-6 py-3.5 text-right text-sm tabular-nums text-green-600">{r.current > 0 ? formatCurrency(r.current) : '\u2014'}</TableCell>
                    <TableCell className="px-6 py-3.5 text-right text-sm tabular-nums text-yellow-600">{r.d1_30 > 0 ? formatCurrency(r.d1_30) : '\u2014'}</TableCell>
                    <TableCell className="px-6 py-3.5 text-right text-sm tabular-nums text-orange-600">{r.d31_60 > 0 ? formatCurrency(r.d31_60) : '\u2014'}</TableCell>
                    <TableCell className="px-6 py-3.5 text-right text-sm tabular-nums text-red-600">{r.d61_90 > 0 ? formatCurrency(r.d61_90) : '\u2014'}</TableCell>
                    <TableCell className="px-6 py-3.5 text-right text-sm tabular-nums text-red-800">{r.d90plus > 0 ? formatCurrency(r.d90plus) : '\u2014'}</TableCell>
                    <TableCell className="px-6 py-3.5 text-right text-sm font-medium tabular-nums text-foreground">{formatCurrency(r.total)}</TableCell>
                    <TableCell className="px-6 py-3.5 text-center text-sm tabular-nums text-text-secondary">
                      <Badge variant="muted" className="min-w-[2rem] justify-center">{String(r.invoiceCount)}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </TierGate>
  );
}
