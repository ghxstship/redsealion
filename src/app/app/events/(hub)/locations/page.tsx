import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import LocationsTable, { type LocationItem } from '@/components/admin/locations/LocationsTable';
import LocationsHeader from '@/components/admin/locations/LocationsHeader';
import PageHeader from '@/components/shared/PageHeader';
import EventsHubTabs from '../../EventsHubTabs';

async function getLocations(): Promise<LocationItem[]> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) throw new Error('No auth');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No auth');

    const { data: items } = await supabase
      .from('locations')
      .select()
      .eq('organization_id', ctx.organizationId)
      .order('name');

    if (!items || items.length === 0) return [];

    return items.map((item: Record<string, unknown>) => ({
      id: item.id as string,
      name: item.name as string,
      type: (item.type as string) ?? 'venue',
      formatted_address: (item.formatted_address as string) ?? null,
      phone: (item.phone as string) ?? null,
      capacity: (item.capacity as number) ?? null,
      timezone: (item.timezone as string) ?? null,
      google_place_id: (item.google_place_id as string) ?? null,
      status: (item.status as string) ?? 'active',
    }));
  } catch {
    return [];
  }
}

function formatLabel(s: string): string {
  return s.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export default async function LocationsPage() {
  const locations = await getLocations();

  const typeCounts = locations.reduce(
    (acc, item) => { acc[item.type] = (acc[item.type] ?? 0) + 1; return acc; },
    {} as Record<string, number>
  );

  // Show top 4 types
  const topTypes = Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return (
    <>
      <PageHeader

        title="Locations"

        subtitle={`${locations.length} locations · ${typeCounts.virtual ?? 0} virtual`}

      >

        <LocationsHeader />

      </PageHeader>

      <EventsHubTabs />

      {/* Type summary cards */}
      {topTypes.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
          {topTypes.map(([type, count]) => (
            <div key={type} className="rounded-xl border border-border bg-background p-4">
              <p className="text-xs text-text-muted">{formatLabel(type)}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{count}</p>
            </div>
          ))}
        </div>
      )}

      <LocationsTable locations={locations} />
    </>
  );
}
