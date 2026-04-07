import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import FabricationHubTabs from '../../FabricationHubTabs';

async function getPrintJobs() {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return [];
    const { data } = await supabase
      .from('fabrication_orders')
      .select('id, order_number, name, status, priority, quantity, total_cost_cents, due_date')
      .eq('organization_id', ctx.organizationId)
      .eq('order_type', 'print')
      .order('due_date', { ascending: true });
    return (data ?? []) as Array<{
      id: string; order_number: string; name: string; status: string;
      priority: string; quantity: number; total_cost_cents: number; due_date: string | null;
    }>;
  } catch { return []; }
}

export default async function PrintPage() {
  const jobs = await getPrintJobs();

  return (
    <TierGate feature="equipment">
      <PageHeader title="Print Production" subtitle="Track signage, graphics, and print orders." />
      <FabricationHubTabs />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 mb-8">
        <div className="rounded-xl border border-border bg-white p-4">
          <p className="text-xs text-text-muted">Print Jobs</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{jobs.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-white p-4">
          <p className="text-xs text-text-muted">In Production</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-blue-600">{jobs.filter((j) => j.status === 'in_production').length}</p>
        </div>
        <div className="rounded-xl border border-border bg-white p-4">
          <p className="text-xs text-text-muted">Total Cost</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{formatCurrency(jobs.reduce((s, j) => s + j.total_cost_cents, 0) / 100)}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white overflow-hidden">
        {jobs.length === 0 ? (
          <div className="px-8 py-16 text-center"><p className="text-sm text-text-secondary">No print jobs. Create a fabrication order with type &quot;print&quot; to start tracking.</p></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-bg-secondary text-left text-xs font-medium text-text-muted uppercase tracking-wider">
              <tr><th className="px-4 py-3">Order #</th><th className="px-4 py-3">Name</th><th className="px-4 py-3">Qty</th><th className="px-4 py-3">Cost</th><th className="px-4 py-3">Due</th><th className="px-4 py-3">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {jobs.map((j) => (
                <tr key={j.id} className="hover:bg-bg-secondary/50 transition-colors">
                  <td className="px-4 py-3"><Link href={`/app/fabrication/${j.id}`} className="font-medium text-foreground hover:underline">{j.order_number}</Link></td>
                  <td className="px-4 py-3 text-text-secondary">{j.name}</td>
                  <td className="px-4 py-3 tabular-nums">{j.quantity}</td>
                  <td className="px-4 py-3 tabular-nums">{formatCurrency(j.total_cost_cents / 100)}</td>
                  <td className="px-4 py-3 text-text-secondary">{j.due_date ? new Date(j.due_date).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${j.status === 'completed' ? 'bg-green-50 text-green-700' : j.status === 'in_production' ? 'bg-blue-50 text-blue-700' : 'bg-yellow-50 text-yellow-700'}`}>{j.status.replace('_', ' ')}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </TierGate>
  );
}
