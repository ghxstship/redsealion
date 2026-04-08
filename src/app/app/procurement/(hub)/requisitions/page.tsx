import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import { formatCurrency } from '@/lib/utils';
import ProcurementHubTabs from '../../ProcurementHubTabs';

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

const STATUS_COLORS: Record<string, string> = { draft: 'bg-gray-50 text-gray-700', submitted: 'bg-yellow-50 text-yellow-700', approved: 'bg-green-50 text-green-700', rejected: 'bg-red-50 text-red-700', ordered: 'bg-blue-50 text-blue-700' };

export default async function RequisitionsPage() {
  const reqs = await getRequisitions();

  return (
    <TierGate feature="equipment">
      <PageHeader title="Requisitions" subtitle="Submit and track internal purchase requests." />
      <ProcurementHubTabs />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        {[
          { label: 'Total', value: reqs.length },
          { label: 'Pending', value: reqs.filter((r) => r.status === 'submitted').length, color: 'text-yellow-600' },
          { label: 'Approved', value: reqs.filter((r) => r.status === 'approved').length, color: 'text-green-600' },
          { label: 'Total Value', value: formatCurrency(reqs.reduce((s, r) => s + r.total_cents, 0) / 100) },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-background p-4">
            <p className="text-xs text-text-muted">{stat.label}</p>
            <p className={`mt-1 text-2xl font-semibold tabular-nums ${stat.color ?? 'text-foreground'}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-background overflow-hidden">
        {reqs.length === 0 ? (
          <div className="px-8 py-16 text-center"><p className="text-sm text-text-secondary">No requisitions submitted. Create a requisition to request materials or services.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-secondary text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                <tr><th className="px-4 py-3">Req #</th><th className="px-4 py-3">Priority</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Needed By</th><th className="px-4 py-3">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reqs.map((r) => (
                  <tr key={r.id} className="hover:bg-bg-secondary/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{r.requisition_number}</td>
                    <td className="px-4 py-3 capitalize text-text-secondary">{r.priority}</td>
                    <td className="px-4 py-3 tabular-nums">{formatCurrency(r.total_cents / 100)}</td>
                    <td className="px-4 py-3 text-text-secondary">{r.needed_by ? new Date(r.needed_by).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[r.status]}`}>{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </TierGate>
  );
}
