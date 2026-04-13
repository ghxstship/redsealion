import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import GoalsPageClient from './GoalsPageClient';

export const dynamic = 'force-dynamic';

type GoalKeyResult = {
  id: string;
  title: string;
  target: number;
  current: number;
  start_value: number | null;
  unit: string | null;
  deleted_at: string | null;
};

async function getGoals() {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return [];

    const { data } = await supabase
      .from('goals')
      .select('*, goal_key_results(*)')
      .eq('organization_id', ctx.organizationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (!data || data.length === 0) return [];

    return data.map((g) => ({
      id: g.id,
      title: g.title,
      description: g.description,
      status: g.status,
      progress: g.progress ?? 0,
      due_date: g.due_date,
      start_date: g.start_date,
      category: g.category || 'Company',
      key_results: (((g.goal_key_results as GoalKeyResult[]) ?? []).filter((kr) => !kr.deleted_at)).map((kr) => ({
        id: kr.id,
        title: kr.title,
        target: kr.target,
        current: kr.current,
        start_value: kr.start_value || 0,
        unit: kr.unit || '',
      })),
    }));
  } catch (err) {
    console.error('Failed to get goals:', err);
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
      <GoalsPageClient goals={goals} />
    </TierGate>
  );
}
