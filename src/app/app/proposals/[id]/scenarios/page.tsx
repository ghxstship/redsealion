import { createClient } from '@/lib/supabase/server';
import { TierGate } from '@/components/shared/TierGate';
import { formatCurrency } from '@/lib/utils';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/shared/PageHeader';
import Card from '@/components/ui/Card';
import { Check, Star, Sparkles, Diamond } from 'lucide-react';

interface Scenario {
  id: string;
  name: string;
  description: string | null;
  totalValue: number;
  isBaseline: boolean;
  tier: string | null;
  phaseCount: number;
  addonsIncluded: number;
}

async function getScenarios(proposalId: string): Promise<{ proposalName: string; currency: string; scenarios: Scenario[] }> {
  try {
    const supabase = await createClient();
    const [proposalRes, scenariosRes] = await Promise.all([
      supabase.from('proposals').select('name, currency').eq('id', proposalId).single(),
      supabase
        .from('proposal_scenarios')
        .select('id, name, description, total_value, is_baseline, tier, phase_count, addons_included')
        .eq('proposal_id', proposalId)
        .order('total_value'),
    ]);

    return {
      proposalName: proposalRes.data?.name ?? 'Unknown Proposal',
      currency: proposalRes.data?.currency ?? 'USD',
      scenarios: (scenariosRes.data ?? []).map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        totalValue: s.total_value,
        isBaseline: s.is_baseline,
        tier: (s as Record<string, unknown>).tier as string | null ?? null,
        phaseCount: ((s as Record<string, unknown>).phase_count as number) ?? 0,
        addonsIncluded: ((s as Record<string, unknown>).addons_included as number) ?? 0,
      })),
    };
  } catch {
    return { proposalName: 'Unknown', currency: 'USD', scenarios: [] };
  }
}

const tierConfig: Record<string, { label: string; icon: React.ReactNode; color: string; bgColor: string; borderColor: string }> = {
  good: {
    label: 'Good',
    icon: <Check size={16} />,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
  },
  better: {
    label: 'Better',
    icon: <Star size={16} />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  best: {
    label: 'Best',
    icon: <Diamond size={16} />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
};

export default async function ScenariosPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const { proposalName, currency, scenarios } = await getScenarios(id);

  return (
    <TierGate feature="scenarios">
      <PageHeader
        title="Scenarios"
        subtitle={`Compare pricing scenarios for ${proposalName}.`}
      />

      {scenarios.length === 0 ? (
        <div className="space-y-8">
          <EmptyState
            message="No scenarios configured yet"
            description="Create Good, Better, and Best pricing tiers to give your client flexibility."
          />

          {/* Quick-start tier selector */}
          <Card className="p-8">
            <div className="text-center mb-8">
              <Sparkles size={24} className="mx-auto text-text-muted mb-3" />
              <h3 className="text-sm font-semibold text-foreground mb-1">Quick Start: Tier-Based Scenarios</h3>
              <p className="text-xs text-text-secondary max-w-md mx-auto">
                Build a Good / Better / Best framework to present your client with clear options that fit different budgets and ambition levels.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(['good', 'better', 'best'] as const).map((tier) => {
                const config = tierConfig[tier];
                return (
                  <div
                    key={tier}
                    className={`rounded-xl border-2 ${config.borderColor} ${config.bgColor} p-6 text-center transition-shadow hover:shadow-md cursor-pointer`}
                  >
                    <div className={`inline-flex items-center justify-center h-10 w-10 rounded-full ${config.bgColor} ${config.color} mb-3`}>
                      {config.icon}
                    </div>
                    <h4 className={`text-lg font-semibold ${config.color}`}>{config.label}</h4>
                    <p className="text-xs text-text-secondary mt-2">
                      {tier === 'good'
                        ? 'Core scope only. Essential deliverables, no add-ons.'
                        : tier === 'better'
                        ? 'Core + recommended add-ons. Balanced scope.'
                        : 'Full scope with all add-ons. Maximum impact.'}
                    </p>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Comparison grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {scenarios.map((scenario) => {
              const tier = scenario.tier ? tierConfig[scenario.tier] : null;
              return (
                <Card
                  key={scenario.id}
                  className={`relative p-6 transition-shadow hover:shadow-md ${
                    scenario.isBaseline ? 'ring-2 ring-foreground' : ''
                  } ${tier ? tier.borderColor : 'border-border'}`}
                >
                  {/* Baseline badge */}
                  {scenario.isBaseline && (
                    <div className="absolute -top-3 left-4">
                      <span className="inline-flex items-center rounded-full bg-foreground px-3 py-1 text-[10px] font-semibold text-background tracking-wider uppercase">
                        Recommended
                      </span>
                    </div>
                  )}

                  {/* Tier badge */}
                  {tier && (
                    <div className={`inline-flex items-center gap-1.5 rounded-full ${tier.bgColor} px-3 py-1 mb-4`}>
                      <span className={tier.color}>{tier.icon}</span>
                      <span className={`text-xs font-semibold ${tier.color}`}>{tier.label}</span>
                    </div>
                  )}

                  <h3 className="text-base font-semibold text-foreground mb-1">{scenario.name}</h3>

                  {scenario.description && (
                    <p className="text-xs text-text-secondary mb-4 line-clamp-2">{scenario.description}</p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 mb-4 text-xs text-text-muted">
                    {scenario.phaseCount > 0 && (
                      <span>{scenario.phaseCount} phases</span>
                    )}
                    {scenario.addonsIncluded > 0 && (
                      <span>{scenario.addonsIncluded} add-ons</span>
                    )}
                  </div>

                  {/* Price */}
                  <div className="pt-4 border-t border-border">
                    <p className="text-3xl font-light tracking-tight text-foreground tabular-nums">
                      {formatCurrency(scenario.totalValue, currency)}
                    </p>
                    <p className="text-[10px] text-text-muted mt-1">Total investment</p>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Side-by-side comparison table */}
          {scenarios.length > 1 && (
            <Card className="p-6 overflow-x-auto">
              <h3 className="text-sm font-semibold text-foreground mb-4">Side-by-Side Comparison</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-text-muted border-b border-border">
                    <th className="py-2 font-medium w-48">Metric</th>
                    {scenarios.map((s) => (
                      <th key={s.id} className="py-2 font-medium text-right">
                        {s.name}
                        {s.isBaseline && (
                          <span className="ml-1 text-[10px] text-blue-500">★</span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/50">
                    <td className="py-2.5 text-text-secondary">Investment</td>
                    {scenarios.map((s) => (
                      <td key={s.id} className="py-2.5 text-right font-semibold tabular-nums text-foreground">
                        {formatCurrency(s.totalValue, currency)}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2.5 text-text-secondary">Phases</td>
                    {scenarios.map((s) => (
                      <td key={s.id} className="py-2.5 text-right tabular-nums">{s.phaseCount || '—'}</td>
                    ))}
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2.5 text-text-secondary">Add-ons Included</td>
                    {scenarios.map((s) => (
                      <td key={s.id} className="py-2.5 text-right tabular-nums">{s.addonsIncluded || '—'}</td>
                    ))}
                  </tr>
                  {scenarios.some((s) => s.tier) && (
                    <tr>
                      <td className="py-2.5 text-text-secondary">Tier</td>
                      {scenarios.map((s) => {
                        const t = s.tier ? tierConfig[s.tier] : null;
                        return (
                          <td key={s.id} className="py-2.5 text-right">
                            {t ? (
                              <span className={`inline-flex items-center gap-1 text-xs font-medium ${t.color}`}>
                                {t.icon}
                                {t.label}
                              </span>
                            ) : '—'}
                          </td>
                        );
                      })}
                    </tr>
                  )}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      )}
    </TierGate>
  );
}
