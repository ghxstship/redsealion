import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import PipelineHubTabs from '../../PipelineHubTabs';

async function getDeals() {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return [];
    const { data } = await supabase
      .from('deals')
      .select('id, title, stage, deal_value, probability, expected_close_date, clients(company_name)')
      .eq('organization_id', ctx.organizationId)
      .is('deleted_at', null)
      .order('deal_value', { ascending: false })
      .limit(1000);
    return (data ?? []).map((d: Record<string, unknown>) => ({
      id: d.id as string,
      title: d.title as string,
      stage: d.stage as string,
      value: (d.deal_value as number) ?? 0,
      probability: (d.probability as number) ?? 0,
      expected_close_date: d.expected_close_date as string | null,
      clients: d.clients ? { name: (Array.isArray(d.clients) ? (d.clients as Record<string, unknown>[])[0]?.company_name as string : (d.clients as Record<string, unknown>).company_name as string) ?? '' } : null,
    }));
  } catch { return []; }
}

export default async function PipelineListPage() {
  const deals = await getDeals();
  const totalValue = deals.reduce((s, d) => s + (d.value ?? 0), 0);
  const weightedValue = deals.reduce((s, d) => s + (d.value ?? 0) * ((d.probability ?? 0) / 100), 0);

  return (
    <TierGate feature="pipeline">
      <PageHeader title="Pipeline List" subtitle="All deals in a sortable table view." />
      <PipelineHubTabs />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 mb-8">
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs text-text-muted">Total Deals</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{deals.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs text-text-muted">Pipeline Value</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{formatCurrency(totalValue)}</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs text-text-muted">Weighted Value</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-green-600">{formatCurrency(weightedValue)}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-background overflow-hidden">
        {deals.length === 0 ? (
          <div className="px-8 py-16 text-center">
            <p className="text-sm text-text-secondary">No deals in your pipeline. Add deals to start tracking revenue.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-secondary text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Deal</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Stage</th>
                  <th className="px-4 py-3">Value</th>
                  <th className="px-4 py-3">Probability</th>
                  <th className="px-4 py-3">Close Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {deals.map((deal) => (
                  <tr key={deal.id} className="hover:bg-bg-secondary/50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/app/pipeline/${deal.id}`} className="font-medium text-foreground hover:underline">{deal.title}</Link>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{deal.clients?.name ?? '—'}</td>
                    <td className="px-4 py-3"><span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 capitalize">{deal.stage?.replace('_', ' ')}</span></td>
                    <td className="px-4 py-3 tabular-nums">{formatCurrency(deal.value)}</td>
                    <td className="px-4 py-3 tabular-nums">{deal.probability}%</td>
                    <td className="px-4 py-3 text-text-secondary">{deal.expected_close_date ? new Date(deal.expected_close_date).toLocaleDateString() : '—'}</td>
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
