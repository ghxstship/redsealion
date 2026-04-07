import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import DispatchHubTabs from '../../DispatchHubTabs';

async function getHistory() {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return [];
    const { data } = await supabase
      .from('work_orders')
      .select('id, title, status, location, assigned_to, scheduled_date, completed_at')
      .eq('organization_id', ctx.organizationId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(50);
    return (data ?? []) as Array<{ id: string; title: string; status: string; location: string | null; assigned_to: string | null; scheduled_date: string | null; completed_at: string | null }>;
  } catch { return []; }
}

export default async function DispatchHistoryPage() {
  const history = await getHistory();

  return (
    <TierGate feature="work_orders">
      <PageHeader title="Dispatch History" subtitle="Completed dispatches and performance records." />
      <DispatchHubTabs />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 mb-8">
        <div className="rounded-xl border border-border bg-white p-4">
          <p className="text-xs text-text-muted">Completed Dispatches</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{history.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-white p-4">
          <p className="text-xs text-text-muted">Unique Locations Served</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{new Set(history.map((h) => h.location).filter(Boolean)).size}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white overflow-hidden">
        {history.length === 0 ? (
          <div className="px-8 py-16 text-center">
            <p className="text-sm text-text-secondary">No completed dispatches yet. History populates as work orders are completed.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-bg-secondary text-left text-xs font-medium text-text-muted uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Job</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Assigned To</th>
                <th className="px-4 py-3">Scheduled</th>
                <th className="px-4 py-3">Completed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {history.map((item) => (
                <tr key={item.id} className="hover:bg-bg-secondary/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{item.title}</td>
                  <td className="px-4 py-3 text-text-secondary">{item.location ?? '—'}</td>
                  <td className="px-4 py-3 text-text-secondary">{item.assigned_to ?? '—'}</td>
                  <td className="px-4 py-3 text-text-secondary">{item.scheduled_date ? new Date(item.scheduled_date).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3 text-text-secondary">{item.completed_at ? new Date(item.completed_at).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </TierGate>
  );
}
