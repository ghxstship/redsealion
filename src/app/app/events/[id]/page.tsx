import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { notFound } from 'next/navigation';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge, { EVENT_STATUS_COLORS } from '@/components/ui/StatusBadge';
import { Badge } from '@/components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { MapPin } from 'lucide-react';

const HIERARCHY_STATUS_COLORS: Record<string, string> = {
  draft: 'default', advancing: 'info', confirmed: 'success',
  locked: 'warning', complete: 'success', archived: 'default',
};

async function getEvent(id: string) {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return null;
    const { data } = await supabase
      .from('events')
      .select(`
        *,
        zones(id, name, slug, type, status, color_hex, sort_order,
          activations(id, name, type, status, hierarchy_status, space_id, sort_order,
            spaces(id, name, type)
          )
        ),
        event_locations(location_id, is_primary, locations(id, name, type)),
        production_schedules(id, name, schedule_type, status)
      `)
      .eq('id', id)
      .eq('organization_id', ctx.organizationId)
      .is('deleted_at', null)
      .single();
    return data;
  } catch { return null; }
}



export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();

  const zones = (event.zones ?? []) as Array<Record<string, unknown>>;
  const eventLocations = (event.event_locations ?? []) as Array<Record<string, unknown>>;
  const schedules = (event.production_schedules ?? []) as Array<Record<string, unknown>>;

  return (
    <TierGate feature="events">
      <PageHeader title={event.name as string} subtitle={event.subtitle as string ?? `${event.type} event`}>
        <Link href="/app/events" className="btn-secondary text-sm">← Back to Events</Link>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        {/* Event Info */}
        <div className="rounded-xl border border-border bg-background p-6 md:col-span-2">
          <h3 className="text-sm font-semibold text-foreground mb-4">Event Details</h3>
          <dl className="grid grid-cols-2 gap-y-3 gap-x-8 text-sm">
            <div><dt className="text-text-muted">Status</dt><dd className="mt-0.5"><StatusBadge status={event.status as string} colorMap={EVENT_STATUS_COLORS} /></dd></div>
            <div><dt className="text-text-muted">Type</dt><dd className="mt-0.5 text-foreground capitalize">{event.type as string}</dd></div>
            <div><dt className="text-text-muted">Starts</dt><dd className="mt-0.5 text-foreground">{event.starts_at ? new Date(event.starts_at as string).toLocaleString() : '—'}</dd></div>
            <div><dt className="text-text-muted">Ends</dt><dd className="mt-0.5 text-foreground">{event.ends_at ? new Date(event.ends_at as string).toLocaleString() : '—'}</dd></div>
            <div><dt className="text-text-muted">Event Code</dt><dd className="mt-0.5 text-foreground font-mono">{(event.event_code as string) ?? '—'}</dd></div>
            <div><dt className="text-text-muted">Presenter</dt><dd className="mt-0.5 text-foreground">{(event.presenter as string) ?? '—'}</dd></div>
            <div><dt className="text-text-muted">Daily Hours</dt><dd className="mt-0.5 text-foreground">{(event.daily_hours as number) ?? '—'}</dd></div>
            <div><dt className="text-text-muted">Doors Time</dt><dd className="mt-0.5 text-foreground">{(event.doors_time as string) ?? '—'}</dd></div>
          </dl>
          {event.notes && <p className="mt-4 text-sm text-text-secondary border-t border-border pt-4">{event.notes as string}</p>}
        </div>

        {/* Locations */}
        <div className="rounded-xl border border-border bg-background p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Locations ({eventLocations.length})</h3>
            <Button variant="ghost" size="sm" className="text-blue-600">+ Add</Button>
          </div>
          {eventLocations.length === 0 ? (
            <p className="text-sm text-text-secondary">No locations linked.</p>
          ) : (
            <ul className="space-y-2">
              {eventLocations.map((el) => {
                const loc = el.locations as Record<string, unknown> | null;
                return (
                  <li key={el.location_id as string} className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{loc?.name as string ?? '—'}</span>
                    {Boolean(el.is_primary) && <Badge variant="info">Primary</Badge>}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* ── Zones & Activations (L3 → L4) ── */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Zones & Activations</h3>
          <Button variant="ghost" size="sm" className="text-blue-600">+ Add Zone</Button>
        </div>

        {zones.length === 0 ? (
          <div className="rounded-xl border border-border bg-background px-8 py-12 text-center">
            <p className="text-sm text-text-secondary">No zones defined for this event.</p>
            <p className="text-xs text-text-muted mt-1">
              Zones are logical groupings of activations. Create a zone to start organizing your production.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {zones.map((zone) => {
              const zoneActivations = (zone.activations as Array<Record<string, unknown>>) ?? [];
              return (
                <div key={zone.id as string} className="rounded-xl border border-border bg-background overflow-hidden">
                  {/* Zone header */}
                  <div
                    className="px-6 py-4 border-b border-border flex items-center justify-between"
                    style={zone.color_hex ? { borderLeftWidth: 4, borderLeftColor: zone.color_hex as string } : {}}
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <h4 className="text-sm font-semibold text-foreground">{zone.name as string}</h4>
                        <Badge variant="default" className="text-[10px] uppercase tracking-wider">
                          {zone.type as string}
                        </Badge>
                        <StatusBadge
                          status={zone.status as string}
                          colorMap={HIERARCHY_STATUS_COLORS}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-muted">{zoneActivations.length} activation{zoneActivations.length !== 1 ? 's' : ''}</span>
                      <Button variant="ghost" size="sm" className="text-blue-600">+ Activation</Button>
                    </div>
                  </div>

                  {/* Activations within this zone */}
                  {zoneActivations.length === 0 ? (
                    <div className="px-8 py-6 text-center text-sm text-text-muted italic">
                      No activations in this zone.
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Activation</TableHead>
                          <TableHead>Space</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {zoneActivations.map((a) => {
                          const space = a.spaces as Record<string, unknown> | null;
                          return (
                            <TableRow key={a.id as string}>
                              <TableCell className="font-medium text-foreground">{a.name as string}</TableCell>
                              <TableCell className="text-text-secondary text-sm">
                                {space ? (
                                  <span>
                                    <MapPin size={12} className="inline" /> {space.name as string}
                                    <span className="ml-1 text-text-muted text-xs capitalize">({space.type as string})</span>
                                  </span>
                                ) : (
                                  <span className="text-text-muted italic">No space</span>
                                )}
                              </TableCell>
                              <TableCell className="text-text-secondary capitalize">{(a.type as string) ?? '—'}</TableCell>
                              <TableCell>
                                <StatusBadge
                                  status={(a.hierarchy_status || a.status) as string}
                                  colorMap={HIERARCHY_STATUS_COLORS}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Production Schedules */}
      {schedules.length > 0 && (
        <div className="rounded-xl border border-border bg-background overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Production Schedules ({schedules.length})</h3>
          </div>
            <Table >
              <TableHeader>
                <TableRow><TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((s) => (
                  <TableRow key={s.id as string}>
                    <TableCell><Link href={`/app/schedule/${s.id}`} className="font-medium text-foreground hover:underline">{s.name as string}</Link></TableCell>
                    <TableCell className="text-text-secondary capitalize">{(s.schedule_type as string)?.replace('_', ' ')}</TableCell>
                    <TableCell><StatusBadge status={s.status as string} colorMap={EVENT_STATUS_COLORS} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
        </div>
      )}
    </TierGate>
  );
}
