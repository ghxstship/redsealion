import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';

async function getEvent(id: string) {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return null;
    const { data } = await supabase
      .from('events')
      .select('*, activations(id, name, type, status), event_locations(location_id, is_primary, locations(id, name, type)), production_schedules(id, name, schedule_type, status)')
      .eq('id', id)
      .eq('organization_id', ctx.organizationId)
      .is('deleted_at', null)
      .single();
    return data;
  } catch { return null; }
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-yellow-50 text-yellow-700',
  confirmed: 'bg-green-50 text-green-700',
  in_progress: 'bg-blue-50 text-blue-700',
  completed: 'bg-purple-50 text-purple-700',
  cancelled: 'bg-red-50 text-red-700',
};

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();

  const activations = (event.activations ?? []) as Array<Record<string, unknown>>;
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
            <div><dt className="text-text-muted">Status</dt><dd className="mt-0.5"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[event.status as string] ?? ''}`}>{event.status as string}</span></dd></div>
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
            <button className="text-xs font-medium text-blue-600 hover:underline">+ Add</button>
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
                    {Boolean(el.is_primary) && <span className="text-xs bg-blue-50 text-blue-700 rounded-full px-1.5 py-0.5">Primary</span>}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Activations */}
      <div className="rounded-xl border border-border bg-background overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Activations ({activations.length})</h3>
          <button className="text-xs font-medium text-blue-600 hover:underline">+ Add Activation</button>
        </div>
        {activations.length === 0 ? (
          <div className="px-8 py-12 text-center text-sm text-text-secondary">No activations for this event.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-bg-secondary text-left text-xs font-medium text-text-muted uppercase tracking-wider">
              <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {activations.map((a) => (
                <tr key={a.id as string} className="hover:bg-bg-secondary/50">
                  <td className="px-4 py-3 font-medium text-foreground">{a.name as string}</td>
                  <td className="px-4 py-3 text-text-secondary capitalize">{(a.type as string) ?? '—'}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[a.status as string] ?? ''}`}>{a.status as string}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Production Schedules */}
      {schedules.length > 0 && (
        <div className="rounded-xl border border-border bg-background overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Production Schedules ({schedules.length})</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-bg-secondary text-left text-xs font-medium text-text-muted uppercase tracking-wider">
              <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {schedules.map((s) => (
                <tr key={s.id as string} className="hover:bg-bg-secondary/50">
                  <td className="px-4 py-3"><Link href={`/app/schedule/${s.id}`} className="font-medium text-foreground hover:underline">{s.name as string}</Link></td>
                  <td className="px-4 py-3 text-text-secondary capitalize">{(s.schedule_type as string)?.replace('_', ' ')}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[s.status as string] ?? ''}`}>{s.status as string}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </TierGate>
  );
}
