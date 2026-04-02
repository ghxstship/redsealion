import { createClient } from '@/lib/supabase/server';
import { TierGate } from '@/components/shared/TierGate';
import { formatCurrency } from '@/lib/utils';
import MarginChart from '@/components/admin/profitability/MarginChart';

interface ProjectDetail {
  name: string;
  revenue: number;
  costsByCategory: Array<{ category: string; amount: number }>;
}

async function getProjectDetail(proposalId: string): Promise<ProjectDetail | null> {
  try {
    const supabase = await createClient();
    const { data: proposal } = await supabase
      .from('proposals')
      .select('name, total_value')
      .eq('id', proposalId)
      .single();

    if (!proposal) return null;

    const { data: costs } = await supabase
      .from('project_costs')
      .select('category, amount')
      .eq('proposal_id', proposalId);

    const categoryMap = new Map<string, number>();
    for (const c of costs ?? []) {
      categoryMap.set(c.category, (categoryMap.get(c.category) ?? 0) + c.amount);
    }

    return {
      name: proposal.name,
      revenue: proposal.total_value,
      costsByCategory: Array.from(categoryMap.entries()).map(([category, amount]) => ({
        category,
        amount,
      })),
    };
  } catch {
    return null;
  }
}

export default async function ProjectProfitabilityPage(props: { params: Promise<{ proposalId: string }> }) {
  const { proposalId } = await props.params;
  const project = await getProjectDetail(proposalId);

  if (!project) {
    return (
      <div className="rounded-xl border border-border bg-white px-8 py-16 text-center">
        <p className="text-sm text-text-secondary">Project not found.</p>
      </div>
    );
  }

  const totalCosts = project.costsByCategory.reduce((s, c) => s + c.amount, 0);
  const margin = project.revenue - totalCosts;
  const marginPercent = project.revenue > 0 ? Math.round((margin / project.revenue) * 100) : 0;

  return (
    <TierGate feature="profitability">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {project.name}
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Detailed profitability breakdown.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
        <div className="rounded-xl border border-border bg-white px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Revenue</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{formatCurrency(project.revenue)}</p>
        </div>
        <div className="rounded-xl border border-border bg-white px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Total Costs</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{formatCurrency(totalCosts)}</p>
        </div>
        <div className="rounded-xl border border-border bg-white px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Net Margin</p>
          <p className={`mt-2 text-3xl font-semibold tracking-tight ${margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(margin)} ({marginPercent}%)
          </p>
        </div>
      </div>

      <MarginChart revenue={project.revenue} costs={totalCosts} categories={project.costsByCategory} />

      {project.costsByCategory.length > 0 && (
        <div className="mt-8 rounded-xl border border-border bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-base font-semibold text-foreground">Cost Breakdown</h2>
          </div>
          <div className="divide-y divide-border">
            {project.costsByCategory.map((cat) => (
              <div key={cat.category} className="flex items-center justify-between px-6 py-3.5">
                <span className="text-sm font-medium text-foreground capitalize">{cat.category}</span>
                <span className="text-sm tabular-nums text-foreground">{formatCurrency(cat.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </TierGate>
  );
}
