import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import Link from 'next/link';
import PageHeader from '@/components/shared/PageHeader';
import { castRelation } from '@/lib/supabase/cast-relation';

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

    // Get task counts per proposal for progress
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, proposal_id, status')
      .eq('organization_id', ctx.organizationId)
      .is('parent_task_id', null)
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

function statusColor(status: string): string {
  const map: Record<string, string> = {
    approved: 'bg-green-500',
    sent: 'bg-blue-500',
    active: 'bg-blue-500',
    completed: 'bg-gray-400',
    cancelled: 'bg-red-400',
  };
  return map[status] ?? 'bg-purple-500';
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

  return (
    <TierGate feature="tasks">
<PageHeader
        title="Roadmap"
        subtitle="Project timeline across the next two quarters"
      />

      {/* Timeline header */}
      <div className="rounded-xl border border-border bg-background overflow-hidden">
        <div className="grid grid-cols-[200px_1fr] border-b border-border">
          <div className="px-4 py-3 border-r border-border">
            <span className="text-xs font-medium uppercase tracking-wider text-text-muted">
              Project
            </span>
          </div>
          <div className="grid grid-cols-6">
            {months.map((m, idx) => (
              <div
                key={idx}
                className="px-2 py-3 text-center border-r border-border last:border-r-0"
              >
                <span className="text-xs font-medium text-text-muted">{m}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Items */}
        {items.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-text-muted">
            No active projects to display.
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-[200px_1fr] border-b border-border last:border-b-0 hover:bg-bg-secondary/30 transition-colors"
            >
              <div className="px-4 py-3 border-r border-border">
                <Link
                  href={`/app/proposals/${item.id}`}
                  className="text-sm font-medium text-foreground hover:underline truncate block"
                >
                  {item.name}
                </Link>
                {item.clientName && (
                  <p className="text-[11px] text-text-muted truncate">
                    {item.clientName}
                  </p>
                )}
              </div>
              <div className="relative px-2 py-3">
                {/* Bar */}
                <div className="relative h-6 flex items-center">
                  <div
                    className={`h-5 rounded-full ${statusColor(item.status)} opacity-80 flex items-center px-2`}
                    style={{
                      width: `${Math.max(item.progress || 20, 15)}%`,
                      minWidth: '60px',
                    }}
                  >
                    <span className="text-[10px] font-medium text-white truncate">
                      {item.progress}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-6 text-center">
        <Link
          href="/app/tasks/projects"
          className="text-sm font-medium text-text-muted hover:text-foreground transition-colors"
        >
          ← Back to Projects
        </Link>
      </div>
    </TierGate>
  );
}
