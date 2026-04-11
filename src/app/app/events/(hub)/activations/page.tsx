import { formatLabel } from '@/lib/utils';
import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import ActivationsTable, { type ActivationItem } from '@/components/admin/activations/ActivationsTable';
import ActivationsHeader from '@/components/admin/activations/ActivationsHeader';
import PageHeader from '@/components/shared/PageHeader';
import MetricCard from '@/components/ui/MetricCard';
import EventsHubTabs from '../../EventsHubTabs';

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


export default async function ActivationsPage() {
  const activations = await getActivations();

  const statusCounts = activations.reduce(
    (acc, item) => { acc[item.status] = (acc[item.status] ?? 0) + 1; return acc; },
    {} as Record<string, number>
  );

  return (
    <>
      <PageHeader
        title="Activations"
        subtitle={`${activations.length} activations · ${statusCounts.confirmed ?? 0} confirmed · ${statusCounts.in_progress ?? 0} in progress`}
      >
        <ActivationsHeader />
      </PageHeader>

      <EventsHubTabs />

      {/* Status summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5 mb-8">
        {(['draft', 'confirmed', 'in_progress', 'completed', 'cancelled'] as const).map((status) => (
          <MetricCard key={status} label={formatLabel(status)} value={statusCounts[status] ?? 0} />
        ))}
      </div>

      <ActivationsTable activations={activations} />
    </>
  );
}
