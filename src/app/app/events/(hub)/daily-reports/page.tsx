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
    const { data } = await supabase
      .from('daily_reports')
      .select('id, report_date, status, labor_hours, crew_count, deliveries_received, notes, created_at, filed_by, events(name)')
      .eq('organization_id', ctx.organizationId)
      .order('report_date', { ascending: false })
      .limit(50);
    return (data ?? []).map((r: Record<string, unknown>) => ({
      id: r.id as string,
      report_date: r.report_date as string,
      status: r.status as string,
      labor_hours: r.labor_hours as number,
      crew_count: r.crew_count as number,
      deliveries_received: r.deliveries_received as number,
      notes: r.notes as string | null,
      created_at: r.created_at as string,
      event_name: Array.isArray(r.events) ? (r.events as Record<string, unknown>[])[0]?.name as string : (r.events as Record<string, unknown> | null)?.name as string ?? null,
    }));
  } catch { return []; }
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-yellow-50 text-yellow-700',
  submitted: 'bg-blue-50 text-blue-700',
  approved: 'bg-green-50 text-green-700',
};

export default async function DailyReportsPage() {
  const reports = await getDailyReports();
  const todayStr = new Date().toISOString().split('T')[0];
  const totalLabor = reports.reduce((s, r) => s + (r.labor_hours ?? 0), 0);

  return (
    <TierGate feature="events">
      <PageHeader title="Daily Reports" subtitle="Field reports for weather, labor, deliveries, and on-site incidents.">
        <button className="btn-primary text-sm whitespace-nowrap hidden sm:inline-flex">+ New Daily Report</button>
      </PageHeader>
      <EventsHubTabs />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        {[
          { label: 'Total Reports', value: reports.length },
          { label: 'Today', value: reports.filter((r) => r.report_date === todayStr).length, color: 'text-blue-600' },
          { label: 'Total Labor Hrs', value: totalLabor.toFixed(1), color: 'text-purple-600' },
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
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3">Labor Hrs</th>
                  <th className="px-4 py-3">Crew</th>
                  <th className="px-4 py-3">Deliveries</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reports.map((r) => (
                  <tr key={r.id} className="hover:bg-bg-secondary/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{new Date(r.report_date + 'T00:00:00').toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-text-secondary">{r.event_name ?? '—'}</td>
                    <td className="px-4 py-3 tabular-nums text-foreground">{r.labor_hours}</td>
                    <td className="px-4 py-3 tabular-nums text-text-secondary">{r.crew_count}</td>
                    <td className="px-4 py-3 tabular-nums text-text-secondary">{r.deliveries_received}</td>
                    <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[r.status]}`}>{r.status}</span></td>
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
