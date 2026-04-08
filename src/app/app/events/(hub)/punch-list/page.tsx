import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import EventsHubTabs from '../../EventsHubTabs';

async function getPunchList() {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return [];
    // Punch list items tracked as tasks with priority and due_date
    const { data } = await supabase
      .from('tasks')
      .select('id, title, status, priority, due_date, assigned_to, events(name)')
      .eq('organization_id', ctx.organizationId)
      .order('due_date', { ascending: true })
      .limit(50);
    return (data ?? []).map((r: Record<string, unknown>) => ({
      id: r.id as string, title: r.title as string, status: r.status as string,
      priority: r.priority as string | null, due_date: r.due_date as string | null,
      event_name: Array.isArray(r.events) ? (r.events as Record<string, unknown>[])[0]?.name as string : (r.events as Record<string, unknown> | null)?.name as string ?? null,
    }));
  } catch { return []; }
}

const PRIORITY_COLORS: Record<string, string> = { low: 'text-gray-500', medium: 'text-yellow-600', high: 'text-orange-600', urgent: 'text-red-600' };

export default async function PunchListPage() {
  const items = await getPunchList();
  const open = items.filter((i) => i.status !== 'completed' && i.status !== 'done');
  const closed = items.filter((i) => i.status === 'completed' || i.status === 'done');

  return (
    <TierGate feature="events">
      <PageHeader title="Punch List" subtitle="Post-event close-out items and deficiency tracking." />
      <EventsHubTabs />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 mb-8">
        {[
          { label: 'Total Items', value: items.length },
          { label: 'Open', value: open.length, color: 'text-yellow-600' },
          { label: 'Closed', value: closed.length, color: 'text-green-600' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-background p-4">
            <p className="text-xs text-text-muted">{stat.label}</p>
            <p className={`mt-1 text-2xl font-semibold tabular-nums ${stat.color ?? 'text-foreground'}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-background overflow-hidden">
        {items.length === 0 ? (
          <div className="px-8 py-16 text-center"><p className="text-sm text-text-secondary">No punch list items. Items are created during event close-out to track remaining work.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-secondary text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                <tr><th className="px-4 py-3">Item</th><th className="px-4 py-3">Event</th><th className="px-4 py-3">Priority</th><th className="px-4 py-3">Due</th><th className="px-4 py-3">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item) => (
                  <tr key={item.id} className={`hover:bg-bg-secondary/50 transition-colors ${item.priority === 'urgent' ? 'bg-red-50/30' : ''}`}>
                    <td className="px-4 py-3 font-medium text-foreground">{item.title}</td>
                    <td className="px-4 py-3 text-text-secondary">{item.event_name ?? '—'}</td>
                    <td className="px-4 py-3"><span className={`font-medium capitalize ${PRIORITY_COLORS[item.priority ?? 'medium']}`}>{item.priority ?? 'medium'}</span></td>
                    <td className="px-4 py-3 text-text-secondary">{item.due_date ? new Date(item.due_date).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${item.status === 'completed' || item.status === 'done' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>{item.status}</span></td>
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
