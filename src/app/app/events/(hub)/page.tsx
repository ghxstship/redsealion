import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { formatLabel } from '@/lib/utils';
import EventsTable, { type EventItem } from '@/components/admin/events/EventsTable';
import EventsHeader from '@/components/admin/events/EventsHeader';
import PageHeader from '@/components/shared/PageHeader';
import Card from '@/components/ui/Card';
import { TierGate } from '@/components/shared/TierGate';
import EventsHubTabs from '../EventsHubTabs';

async function getEvents(): Promise<EventItem[]> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) throw new Error('No auth');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No auth');

    const { data: items } = await supabase
      .from('events')
      .select('*, event_locations(location_id)')
      .eq('organization_id', ctx.organizationId)
      .order('starts_at', { ascending: false });

    if (!items || items.length === 0) return [];

    return items.map((item: Record<string, unknown>) => ({
      id: item.id as string,
      name: item.name as string,
      type: (item.type as string) ?? 'production',
      status: (item.status as string) ?? 'draft',
      starts_at: (item.starts_at as string) ?? null,
      ends_at: (item.ends_at as string) ?? null,
      event_code: (item.event_code as string) ?? null,
      presenter: (item.presenter as string) ?? null,
      location_count: Array.isArray(item.event_locations) ? (item.event_locations as unknown[]).length : 0,
    }));
  } catch {
    return [];
  }
}



export default async function EventsPage() {
  const events = await getEvents();

  const statusCounts = events.reduce(
    (acc, item) => { acc[item.status] = (acc[item.status] ?? 0) + 1; return acc; },
    {} as Record<string, number>
  );

  return (
    <TierGate feature="events">
    <>
      <PageHeader

        title="Events"

        subtitle={`${events.length} events · ${statusCounts.confirmed ?? 0} confirmed · ${statusCounts.in_progress ?? 0} in progress`}

      >

        <EventsHeader />

      </PageHeader>

      <EventsHubTabs />

      {/* Status summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5 mb-8">
        {(['draft', 'confirmed', 'in_progress', 'completed', 'cancelled'] as const).map((status) => (
          <Card key={status} padding="sm">
            <p className="text-xs text-text-muted">{formatLabel(status)}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{statusCounts[status] ?? 0}</p>
          </Card>
        ))}
      </div>

      <EventsTable events={events} />
    </>
    </TierGate>
  );
}
