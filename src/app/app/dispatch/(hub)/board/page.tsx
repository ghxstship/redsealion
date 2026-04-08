import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import Link from 'next/link';
import DispatchHubTabs from '../../DispatchHubTabs';

async function getDispatchBoard() {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return { columns: {} as Record<string, Array<{ id: string; title: string; location: string | null; assigned_to: string | null; scheduled_date: string | null }>> };
    const { data } = await supabase
      .from('work_orders')
      .select('id, title, status, location, assigned_to, scheduled_date')
      .eq('organization_id', ctx.organizationId)
      .in('status', ['pending', 'dispatched', 'on_site', 'completed'])
      .order('scheduled_date', { ascending: true });
    const items = (data ?? []) as Array<{ id: string; title: string; status: string; location: string | null; assigned_to: string | null; scheduled_date: string | null }>;
    const columns = items.reduce((acc, item) => {
      acc[item.status] = acc[item.status] ?? [];
      acc[item.status].push(item);
      return acc;
    }, {} as Record<string, typeof items>);
    return { columns };
  } catch { return { columns: {} }; }
}

const STATUS_LABELS: Record<string, string> = { pending: 'Pending', dispatched: 'Dispatched', on_site: 'On Site', completed: 'Completed' };
const STATUS_COLORS: Record<string, string> = { pending: 'border-yellow-200 bg-yellow-50', dispatched: 'border-blue-200 bg-blue-50', on_site: 'border-green-200 bg-green-50', completed: 'border-gray-200 bg-gray-50' };

export default async function DispatchBoardPage() {
  const { columns } = await getDispatchBoard();
  const statuses = ['pending', 'dispatched', 'on_site', 'completed'];

  return (
    <TierGate feature="work_orders">
      <PageHeader title="Dispatch Board" subtitle="Kanban view of dispatch status across active jobs." />
      <DispatchHubTabs />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statuses.map((status) => {
          const items = columns[status] ?? [];
          return (
            <div key={status} className="rounded-xl border border-border bg-bg-secondary/30 p-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">{STATUS_LABELS[status]}</h3>
                <span className="text-xs font-medium tabular-nums text-text-muted">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border bg-background px-3 py-6 text-center">
                    <p className="text-xs text-text-muted">No items</p>
                  </div>
                ) : items.map((item) => (
                  <Link key={item.id} href={`/app/dispatch/${item.id}`} className={`block rounded-lg border px-3 py-3 transition-shadow hover:shadow-md ${STATUS_COLORS[status]}`}>
                    <p className="text-sm font-medium text-foreground line-clamp-1">{item.title}</p>
                    {item.location && <p className="text-xs text-text-secondary mt-1">📍 {item.location}</p>}
                    {item.scheduled_date && <p className="text-xs text-text-muted mt-1">{new Date(item.scheduled_date).toLocaleDateString()}</p>}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </TierGate>
  );
}
