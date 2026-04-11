import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import PipelineHubTabs from '../../PipelineHubTabs';
import StatusBadge, { PIPELINE_STAGE_COLORS } from '@/components/ui/StatusBadge';
import MetricCard from '@/components/ui/MetricCard';

const PAGE_SIZE = 50;

interface DealRow {
  id: string;
  title: string;
  stage: string;
  value: number;
  probability: number;
  expected_close_date: string | null;
  clients: { name: string } | null;
}

/**
 * Pipeline List Page
 *
 * #41: Server-side pagination via searchParams.page
 */

async function getDeals(page: number): Promise<{ deals: DealRow[]; total: number }> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return { deals: [], total: 0 };

    const offset = (page - 1) * PAGE_SIZE;

    const { data, count } = await supabase
      .from('deals')
      .select('id, title, stage, deal_value, probability, expected_close_date, clients(company_name)', { count: 'exact' })
      .eq('organization_id', ctx.organizationId)
      .is('deleted_at', null)
      .order('deal_value', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    const deals = (data ?? []).map((d: Record<string, unknown>) => ({
      id: d.id as string,
      title: d.title as string,
      stage: d.stage as string,
      value: (d.deal_value as number) ?? 0,
      probability: (d.probability as number) ?? 0,
      expected_close_date: d.expected_close_date as string | null,
      clients: d.clients ? { name: (Array.isArray(d.clients) ? (d.clients as Record<string, unknown>[])[0]?.company_name as string : (d.clients as Record<string, unknown>).company_name as string) ?? '' } : null,
    }));

    return { deals, total: count ?? 0 };
  } catch { return { deals: [], total: 0 }; }
}

export default async function PipelineListPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.page || '1', 10) || 1);
  const { deals, total } = await getDeals(currentPage);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const totalValue = deals.reduce((s, d) => s + (d.value ?? 0), 0);
  const weightedValue = deals.reduce((s, d) => s + (d.value ?? 0) * ((d.probability ?? 0) / 100), 0);

  return (
    <TierGate feature="pipeline">
      <PageHeader title="Pipeline List" subtitle="All deals in a sortable table view." />
      <PipelineHubTabs />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        <MetricCard label="Total Deals" value={total} />
        <MetricCard label="Pipeline Value" value={formatCurrency(totalValue)} />
        <MetricCard label="Weighted Value" value={formatCurrency(weightedValue)} className="[&_.text-foreground]:text-green-600" />
        <MetricCard label="Page" value={`${currentPage} / ${totalPages}`} />
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
                    <td className="px-4 py-3"><StatusBadge status={deal.stage} colorMap={PIPELINE_STAGE_COLORS} /></td>
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

      {/* #41: Server-side pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-text-muted">
          <span>
            Showing {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, total)} of {total} deals
          </span>
          <div className="flex gap-2">
            {currentPage > 1 && (
              <Link
                href={`/app/pipeline/list?page=${currentPage - 1}`}
                className="rounded-lg border border-border px-3 py-1.5 hover:bg-bg-secondary transition-colors"
              >
                ← Previous
              </Link>
            )}
            {currentPage < totalPages && (
              <Link
                href={`/app/pipeline/list?page=${currentPage + 1}`}
                className="rounded-lg border border-border px-3 py-1.5 hover:bg-bg-secondary transition-colors"
              >
                Next →
              </Link>
            )}
          </div>
        </div>
      )}
    </TierGate>
  );
}
