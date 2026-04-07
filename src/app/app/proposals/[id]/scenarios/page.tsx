import { createClient } from '@/lib/supabase/server';
import { TierGate } from '@/components/shared/TierGate';
import { formatCurrency } from '@/lib/utils';
import EmptyState from '@/components/ui/EmptyState';

interface Scenario {
  id: string;
  name: string;
  description: string | null;
  totalValue: number;
  isBaseline: boolean;
}

async function getScenarios(proposalId: string): Promise<{ proposalName: string; scenarios: Scenario[] }> {
  try {
    const supabase = await createClient();
    const [proposalRes, scenariosRes] = await Promise.all([
      supabase.from('proposals').select('name').eq('id', proposalId).single(),
      supabase
        .from('proposal_scenarios')
        .select('id, name, description, total_value, is_baseline')
        .eq('proposal_id', proposalId)
        .order('created_at'),
    ]);

    return {
      proposalName: proposalRes.data?.name ?? 'Unknown Proposal',
      scenarios: (scenariosRes.data ?? []).map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        totalValue: s.total_value,
        isBaseline: s.is_baseline,
      })),
    };
  } catch {
    return { proposalName: 'Unknown', scenarios: [] };
  }
}

export default async function ScenariosPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const { proposalName, scenarios } = await getScenarios(id);

  return (
    <TierGate feature="scenarios">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Scenarios
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Compare pricing scenarios for {proposalName}.
        </p>
      </div>

      {scenarios.length === 0 ? (
        <EmptyState
          message="No scenarios configured yet"
          description="Create alternative pricing or scope options for the client."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {scenarios.map((scenario) => (
            <div
              key={scenario.id}
              className={`rounded-xl border bg-white px-5 py-5 ${
                scenario.isBaseline ? 'border-foreground' : 'border-border'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-foreground">{scenario.name}</h3>
                {scenario.isBaseline && (
                  <span className="inline-flex items-center rounded-full bg-foreground px-2 py-0.5 text-xs font-medium text-white">
                    Baseline
                  </span>
                )}
              </div>
              {scenario.description && (
                <p className="text-xs text-text-secondary mb-3">{scenario.description}</p>
              )}
              <p className="text-2xl font-semibold tabular-nums text-foreground">
                {formatCurrency(scenario.totalValue)}
              </p>
            </div>
          ))}
        </div>
      )}
    </TierGate>
  );
}
