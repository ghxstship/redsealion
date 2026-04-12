import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge, { LOCATION_TYPE_ICONS } from '@/components/ui/StatusBadge';

async function getLocation(id: string) {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return null;
    const { data } = await supabase
      .from('locations')
      .select(`
        *,
        event_locations(event_id, is_primary, events(id, name)),
        project_locations(project_id, projects(id, name)),
        schedule_blocks(id, label, event_id, events(name))
      `)
      .eq('id', id)
      .eq('organization_id', ctx.organizationId)
      .is('deleted_at', null)
      .single();
    return data;
  } catch { return null; }
}



import LocationDetailActions from '@/components/admin/locations/LocationDetailActions';

export default async function LocationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const location = await getLocation(id);
  if (!location) notFound();

  const eventLinks = (location.event_locations ?? []) as Array<Record<string, unknown>>;
  const projectLinks = (location.project_locations ?? []) as Array<Record<string, unknown>>;
  const blockLinks = (location.schedule_blocks ?? []) as Array<Record<string, unknown>>;

  return (
    <TierGate feature="events">
      <PageHeader title={location.name as string} subtitle={`${LOCATION_TYPE_ICONS[location.type as string] ?? '📍'} ${(location.type as string)?.charAt(0).toUpperCase()}${(location.type as string)?.slice(1)} location`}>
        <div className="flex items-center gap-3">
          <Link href="/app/locations" className="text-sm text-text-secondary hover:text-foreground">← Back to Locations</Link>
          <div className="h-4 w-px bg-border" />
          <LocationDetailActions location={location} />
        </div>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="rounded-xl border border-border bg-background p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Location Details</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-text-muted">Type</dt><dd className="text-foreground capitalize">{location.type as string}</dd></div>
            <div className="flex justify-between"><dt className="text-text-muted">Status</dt><dd className="text-foreground capitalize">{location.status as string}</dd></div>
            <div className="flex justify-between"><dt className="text-text-muted">Slug</dt><dd className="text-foreground font-mono text-xs">{(location.slug as string) ?? '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-text-muted">Capacity</dt><dd className="text-foreground tabular-nums">{location.capacity ? (location.capacity as number).toLocaleString() : '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-text-muted">Timezone</dt><dd className="text-foreground">{(location.timezone as string) ?? '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-text-muted">Phone</dt><dd className="text-foreground">{(location.phone as string) ?? '—'}</dd></div>
            <div className="col-span-full border-t border-border my-2 pt-2" />
            <div className="flex justify-between"><dt className="text-text-muted">Address Line 1</dt><dd className="text-foreground">{(location.address_line1 as string) ?? '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-text-muted">Address Line 2</dt><dd className="text-foreground">{(location.address_line2 as string) ?? '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-text-muted">City</dt><dd className="text-foreground">{(location.city as string) ?? '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-text-muted">State</dt><dd className="text-foreground">{(location.state_province as string) ?? '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-text-muted">Postal Code</dt><dd className="text-foreground">{(location.postal_code as string) ?? '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-text-muted">Country</dt><dd className="text-foreground">{(location.country as string) ?? 'US'}</dd></div>
            <div className="col-span-full border-t border-border my-2 pt-2" />
            <div className="flex justify-between"><dt className="text-text-muted">Site Map</dt><dd className="text-foreground truncate max-w-[150px] text-right">{location.site_map_url ? <a href={location.site_map_url as string} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Map</a> : '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-text-muted">Google Place ID</dt><dd className="text-foreground">{(location.google_place_id as string) ?? '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-text-muted">Geo</dt><dd className="text-foreground">{location.latitude && location.longitude ? `${location.latitude}, ${location.longitude}` : '—'}</dd></div>
          </dl>
          {location.notes && <p className="mt-4 text-sm text-text-secondary border-t border-border pt-4">{location.notes as string}</p>}
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-xl border border-border bg-background p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Linked Events ({eventLinks.length})</h3>
            {eventLinks.length === 0 ? (
              <p className="text-sm text-text-secondary">No events linked to this location.</p>
            ) : (
              <ul className="space-y-2 max-h-48 overflow-y-auto">
                {eventLinks.map((el) => {
                  const ev = el.events as { id: string; name: string } | null;
                  return (
                    <li key={el.event_id as string} className="flex items-center justify-between text-sm py-1 border-b border-border/50 last:border-0">
                      <Link href={`/app/events/${ev?.id}`} className="text-foreground hover:underline">{ev?.name ?? '—'}</Link>
                      {(el.is_primary as boolean) && <StatusBadge status="Primary" />}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-border bg-background p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Linked Projects ({projectLinks.length})</h3>
            {projectLinks.length === 0 ? (
              <p className="text-sm text-text-secondary">No projects linked to this location.</p>
            ) : (
              <ul className="space-y-2 max-h-48 overflow-y-auto">
                {projectLinks.map((pl) => {
                  const prj = pl.projects as { id: string; name: string } | null;
                  return (
                    <li key={pl.project_id as string} className="flex items-center justify-between text-sm py-1 border-b border-border/50 last:border-0">
                      <Link href={`/app/projects/${prj?.id}`} className="text-foreground hover:underline truncate">{prj?.name ?? '—'}</Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {blockLinks.length > 0 && (
            <div className="rounded-xl border border-border bg-background p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Schedule Blocks ({blockLinks.length})</h3>
              <ul className="space-y-2 max-h-48 overflow-y-auto">
                {blockLinks.map((bl) => {
                  const ev = bl.events as { name: string } | null;
                  return (
                    <li key={bl.id as string} className="flex flex-col text-sm py-1 border-b border-border/50 last:border-0">
                      <span className="font-medium text-foreground">{bl.label as string}</span>
                      {ev && <span className="text-xs text-text-muted">{ev.name}</span>}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </TierGate>
  );
}
