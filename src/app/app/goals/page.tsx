import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import Link from 'next/link';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/ui/EmptyState';

/**
 * Goals & OKRs — high-level objectives with key results linked to tasks.
 */

interface Goal {
  id: string;
  title: string;
  description: string | null;
  status: string;
  progress: number;
  due_date: string | null;
  key_results: KeyResult[];
}

interface KeyResult {
  id: string;
  title: string;
  target: number;
  current: number;
  unit: string;
}



function statusBadge(status: string): string {
  const map: Record<string, string> = {
    on_track: 'bg-green-100 text-green-700',
    at_risk: 'bg-amber-100 text-amber-700',
    off_track: 'bg-red-100 text-red-700',
    completed: 'bg-blue-100 text-blue-700',
  };
  return map[status] ?? 'bg-bg-secondary text-gray-600';
}

async function getGoals(): Promise<Goal[]> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return [];

    const { data } = await supabase
      .from('goals')
      .select('*, goal_key_results(*)')
      .eq('organization_id', ctx.organizationId)
      .order('created_at', { ascending: false });

    if (!data || data.length === 0) return [];

    return data.map((g) => ({
      id: g.id,
      title: g.title,
      description: g.description,
      status: g.status,
      progress: g.progress ?? 0,
      due_date: g.due_date,
      key_results: (((g.goal_key_results as unknown[]) ?? []) as Array<Record<string, unknown>>).map((kr) => ({
        id: kr.id as string,
        title: kr.title as string,
        target: kr.target as number,
        current: kr.current as number,
        unit: (kr.unit as string) ?? '',
      })),
    }));
  } catch {
    return [];
  }
}

export default async function GoalsPage() {
  const goals = await getGoals();

  return (
    <TierGate feature="tasks">
<PageHeader
        title="Goals & OKRs"
        subtitle="Track high-level objectives and key results across projects."
      />

      <div className="space-y-6">
        {goals.map((goal) => (
          <div
            key={goal.id}
            className="rounded-xl border border-border bg-background p-6"
          >
            {/* Goal header */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-foreground">
                    {goal.title}
                  </h3>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusBadge(goal.status)}`}
                  >
                    {goal.status.replace(/_/g, ' ')}
                  </span>
                </div>
                {goal.description && (
                  <p className="text-xs text-text-secondary">
                    {goal.description}
                  </p>
                )}
              </div>
              {goal.due_date && (
                <span className="text-xs text-text-muted flex-shrink-0">
                  Due {new Date(goal.due_date + 'T00:00:00').toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              )}
            </div>

            {/* Overall progress */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-text-muted">Overall Progress</span>
                <span className="text-xs font-medium tabular-nums text-foreground">
                  {goal.progress}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-bg-secondary overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    goal.progress >= 80
                      ? 'bg-green-500'
                      : goal.progress >= 50
                        ? 'bg-blue-500'
                        : 'bg-amber-500'
                  }`}
                  style={{ width: `${goal.progress}%` }}
                />
              </div>
            </div>

            {/* Key Results */}
            <div className="space-y-3">
              <h4 className="text-xs font-medium uppercase tracking-wider text-text-muted">
                Key Results
              </h4>
              {goal.key_results.map((kr) => {
                const pct = kr.target > 0
                  ? Math.min(Math.round((kr.current / kr.target) * 100), 100)
                  : 0;

                return (
                  <div key={kr.id} className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{kr.title}</p>
                    </div>
                    <div className="w-24 h-1.5 rounded-full bg-bg-secondary overflow-hidden flex-shrink-0">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs tabular-nums text-text-secondary w-20 text-right flex-shrink-0">
                      {kr.current}{kr.unit} / {kr.target}{kr.unit}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {goals.length === 0 && (
        <EmptyState
          message="No goals created yet"
          description="Create goals and key results to track your team's progress."
        />
      )}

      <div className="mt-6 text-center">
        <Link
          href="/app/tasks"
          className="text-sm font-medium text-text-muted hover:text-foreground transition-colors"
        >
          ← Back to Tasks
        </Link>
      </div>
    </TierGate>
  );
}
