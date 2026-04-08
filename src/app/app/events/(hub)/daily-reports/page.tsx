import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import EventsHubTabs from '../../EventsHubTabs';

async function getDailyReports() {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return [];
    // Daily reports stored as tasks with type = 'daily_report' linked to events
    const { data } = await supabase
      .from('tasks')
      .select('id, title, status, due_date, created_at, events(name)')
      .eq('organization_id', ctx.organizationId)
      .order('created_at', { ascending: false })
      .limit(50);
    return (data ?? []).map((r: Record<string, unknown>) => ({
      id: r.id as string, title: r.title as string, status: r.status as string,
      due_date: r.due_date as string | null, created_at: r.created_at as string,
      event_name: Array.isArray(r.events) ? (r.events as Record<string, unknown>[])[0]?.name as string : (r.events as Record<string, unknown> | null)?.name as string ?? null,
    }));
  } catch { return []; }
}

export default async function DailyReportsPage() {
  const reports = await getDailyReports();

  return (
    <TierGate feature="events">
      <PageHeader title="Daily Reports" subtitle="Field reports for weather, labor, deliveries, and on-site incidents." />
      <EventsHubTabs />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 mb-8">
        {[
          { label: 'Total Reports', value: reports.length },
          { label: 'Today', value: reports.filter((r) => r.created_at?.startsWith(new Date().toISOString().split('T')[0])).length, color: 'text-blue-600' },
          { label: 'Events Covered', value: new Set(reports.map((r) => r.event_name).filter(Boolean)).size },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-background p-4">
            <p className="text-xs text-text-muted">{stat.label}</p>
            <p className={`mt-1 text-2xl font-semibold tabular-nums ${stat.color ?? 'text-foreground'}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-background overflow-hidden">
        {reports.length === 0 ? (
          <div className="px-8 py-16 text-center"><p className="text-sm text-text-secondary">No daily reports filed. Reports capture weather, labor hours, deliveries, and incidents during events.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-secondary text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                <tr><th className="px-4 py-3">Report</th><th className="px-4 py-3">Event</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reports.map((r) => (
                  <tr key={r.id} className="hover:bg-bg-secondary/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{r.title}</td>
                    <td className="px-4 py-3 text-text-secondary">{r.event_name ?? '—'}</td>
                    <td className="px-4 py-3 text-text-secondary">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${r.status === 'completed' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>{r.status}</span></td>
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
