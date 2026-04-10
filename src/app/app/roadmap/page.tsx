import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import Link from 'next/link';
import PageHeader from '@/components/shared/PageHeader';
import { castRelation } from '@/lib/supabase/cast-relation';
import RoadmapClient from './RoadmapClient';

/**
 * Roadmap view — timeline-based project visualization
 * showing all proposals/projects on a quarterly timeline.
 */

interface RoadmapItem {
  id: string;
  name: string;
  clientName: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  progress: number;
}

async function getRoadmapItems(): Promise<RoadmapItem[]> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return [];

    const { data: proposals } = await supabase
      .from('proposals')
      .select('id, name, status, event_date, project_end_date, client_id, clients(company_name)')
      .eq('organization_id', ctx.organizationId)
      .not('status', 'eq', 'draft')
      .order('event_date', { ascending: true });

    if (!proposals) return [];

    // Get task counts per proposal for progress (includes subtasks via parent_task_id)
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, proposal_id, parent_task_id, status')
      .eq('organization_id', ctx.organizationId)
      .not('proposal_id', 'is', null);

    const tasksByProposal = new Map<string, { total: number; done: number }>();
    for (const t of tasks ?? []) {
      if (!t.proposal_id) continue;
      const entry = tasksByProposal.get(t.proposal_id) ?? { total: 0, done: 0 };
      entry.total++;
      if (t.status === 'done') entry.done++;
      tasksByProposal.set(t.proposal_id, entry);
    }

    return proposals.map((p) => {
      const client = castRelation<{ company_name: string }>(p.clients);
      const taskData = tasksByProposal.get(p.id);
      const progress = taskData && taskData.total > 0
        ? Math.round((taskData.done / taskData.total) * 100)
        : 0;

      return {
        id: p.id,
        name: p.name,
        clientName: client?.company_name ?? null,
        status: p.status,
        startDate: p.event_date as string | null,
        endDate: (p.project_end_date as string | null) ?? p.event_date as string | null,
        progress,
      };
    });
  } catch {
    return [];
  }
}

export default async function RoadmapPage() {
  const items = await getRoadmapItems();

  // Determine time range
  const now = new Date();
  const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  const months: string[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(quarterStart.getFullYear(), quarterStart.getMonth() + i, 1);
    months.push(
      d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    );
  }

  const timeRangeStart = quarterStart.getTime();
  const timeRangeEnd = new Date(quarterStart.getFullYear(), quarterStart.getMonth() + 6, 1).getTime();

  return (
    <TierGate feature="tasks">
<PageHeader
        title="Roadmap"
        subtitle="Project timeline across the next two quarters"
      />

      <RoadmapClient
        items={items}
        months={months}
        timeRangeStart={timeRangeStart}
        timeRangeEnd={timeRangeEnd}
      />

      <div className="mt-6 text-center">
        <Link
          href="/app/tasks"
          className="text-sm font-medium text-text-muted hover:text-foreground transition-colors"
        >
          ← Back to Projects
        </Link>
      </div>
    </TierGate>
  );
}
