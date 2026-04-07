import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import ActivationsTable, { type ActivationItem } from '@/components/admin/activations/ActivationsTable';
import ActivationsHeader from '@/components/admin/activations/ActivationsHeader';

async function getActivations(): Promise<ActivationItem[]> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) throw new Error('No auth');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No auth');

    const { data: items } = await supabase
      .from('activations')
      .select('*, events(id, name), locations(id, name)')
      .eq('organization_id', ctx.organizationId)
      .order('starts_at', { ascending: false });

    if (!items || items.length === 0) return [];

    return items.map((item: Record<string, unknown>) => ({
      id: item.id as string,
      name: item.name as string,
      type: (item.type as string) ?? 'general',
      status: (item.status as string) ?? 'draft',
      event_name: (item.events as Record<string, unknown>)?.name as string ?? 'Unknown',
      location_name: (item.locations as Record<string, unknown>)?.name as string ?? 'Unknown',
      starts_at: (item.starts_at as string) ?? null,
      ends_at: (item.ends_at as string) ?? null,
    }));
  } catch {
    return [];
  }
}

function formatLabel(s: string): string {
  return s.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export default async function ActivationsPage() {
  const activations = await getActivations();

  const statusCounts = activations.reduce(
    (acc, item) => { acc[item.status] = (acc[item.status] ?? 0) + 1; return acc; },
    {} as Record<string, number>
  );

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Activations</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {activations.length} activations &middot; {statusCounts.confirmed ?? 0} confirmed &middot; {statusCounts.in_progress ?? 0} in progress
          </p>
        </div>
        <div className="flex gap-3">
          <ActivationsHeader />
        </div>
      </div>

      {/* Status summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5 mb-8">
        {(['draft', 'confirmed', 'in_progress', 'completed', 'cancelled'] as const).map((status) => (
          <div key={status} className="rounded-xl border border-border bg-white p-4">
            <p className="text-xs text-text-muted">{formatLabel(status)}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{statusCounts[status] ?? 0}</p>
          </div>
        ))}
      </div>

      <ActivationsTable activations={activations} />
    </>
  );
}
