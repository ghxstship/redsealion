import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import { formatCurrency , formatDate } from '@/lib/utils';
import Link from 'next/link';
import ProcurementHubTabs from '../../ProcurementHubTabs';
import StatusBadge, { PROCUREMENT_REQUISITION_STATUS_COLORS } from '@/components/ui/StatusBadge';
import MetricCard from '@/components/ui/MetricCard';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

async function getRequisitions() {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return [];
    const { data } = await supabase
      .from('purchase_requisitions')
      .select('id, requisition_number, status, priority, needed_by, total_cents, notes, created_at')
      .eq('organization_id', ctx.organizationId)
      .order('created_at', { ascending: false });
    return (data ?? []) as Array<{
      id: string; requisition_number: string; status: string; priority: string;
      needed_by: string | null; total_cents: number; notes: string | null; created_at: string;
    }>;
  } catch { return []; }
}



export default async function RequisitionsPage() {
  const reqs = await getRequisitions();

  return (
    <TierGate feature="procurement">
      <PageHeader title="Requisitions" subtitle="Submit and track internal purchase requests." />
      <ProcurementHubTabs />

      <div className="flex justify-end mb-6">
        <Link href="/app/procurement/requisitions/new" className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-primary/90 transition-colors">
          + New Requisition
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        {[
          { label: 'Total', value: reqs.length },
          { label: 'Pending', value: reqs.filter((r) => r.status === 'submitted').length, color: 'text-yellow-600' },
          { label: 'Approved', value: reqs.filter((r) => r.status === 'approved').length, color: 'text-green-600' },
          { label: 'Total Value', value: formatCurrency(reqs.reduce((s, r) => s + r.total_cents, 0) / 100) },
        ].map((stat) => (
          <MetricCard key={stat.label} label={stat.label} value={stat.value} className={stat.color ? `[&_.text-foreground]:${stat.color}` : ''} />
        ))}
      </div>

      <div className="rounded-xl border border-border bg-background overflow-hidden">
        {reqs.length === 0 ? (
          <div className="px-8 py-16 text-center"><p className="text-sm text-text-secondary">No requisitions submitted. Create a requisition to request materials or services.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <Table >
              <TableHeader >
                <TableRow><TableHead className="px-4 py-3">Req #</TableHead><TableHead className="px-4 py-3">Priority</TableHead><TableHead className="px-4 py-3">Amount</TableHead><TableHead className="px-4 py-3">Needed By</TableHead><TableHead className="px-4 py-3">Status</TableHead></TableRow>
              </TableHeader>
              <TableBody >
                {reqs.map((r) => (
                  <TableRow key={r.id} className="hover:bg-bg-secondary/50 transition-colors">
                    <TableCell className="px-4 py-3"><Link href={`/app/procurement/requisitions/${r.id}`} className="font-medium text-foreground hover:underline">{r.requisition_number}</Link></TableCell>
                    <TableCell className="px-4 py-3 capitalize text-text-secondary">{r.priority}</TableCell>
                    <TableCell className="px-4 py-3 tabular-nums">{formatCurrency(r.total_cents / 100)}</TableCell>
                    <TableCell className="px-4 py-3 text-text-secondary">{r.needed_by ? formatDate(r.needed_by) : '—'}</TableCell>
                    <TableCell className="px-4 py-3"><StatusBadge status={r.status} colorMap={PROCUREMENT_REQUISITION_STATUS_COLORS} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </TierGate>
  );
}
