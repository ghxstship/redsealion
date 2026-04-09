import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';

async function getLocation(id: string) {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return null;
    const { data } = await supabase
      .from('locations')
      .select('*, event_locations(event_id, is_primary, events(id, name))')
      .eq('id', id)
      .eq('organization_id', ctx.organizationId)
      .is('deleted_at', null)
      .single();
    return data;
  } catch { return null; }
}

const TYPE_ICONS: Record<string, string> = {
  venue: '🏟️',
  virtual: '💻',
  hybrid: '🔄',
  warehouse: '🏭',
  office: '🏢',
};

export default async function LocationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const location = await getLocation(id);
  if (!location) notFound();

  const eventLinks = (location.event_locations ?? []) as Array<Record<string, unknown>>;

  return (
    <TierGate feature="events">
      <PageHeader title={location.name as string} subtitle={`${TYPE_ICONS[location.type as string] ?? ''} ${(location.type as string)?.charAt(0).toUpperCase()}${(location.type as string)?.slice(1)} location`}>
        <Link href="/app/events/locations" className="btn-secondary text-sm">← Back to Locations</Link>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="rounded-xl border border-border bg-background p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Location Details</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-text-muted">Type</dt><dd className="text-foreground capitalize">{location.type as string}</dd></div>
            <div className="flex justify-between"><dt className="text-text-muted">Slug</dt><dd className="text-foreground font-mono text-xs">{(location.slug as string) ?? '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-text-muted">Capacity</dt><dd className="text-foreground tabular-nums">{(location.capacity as number) ?? '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-text-muted">Timezone</dt><dd className="text-foreground">{(location.timezone as string) ?? '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-text-muted">Address Line 1</dt><dd className="text-foreground">{(location.address_line1 as string) ?? '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-text-muted">City</dt><dd className="text-foreground">{(location.city as string) ?? '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-text-muted">State</dt><dd className="text-foreground">{(location.state_province as string) ?? '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-text-muted">Postal Code</dt><dd className="text-foreground">{(location.postal_code as string) ?? '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-text-muted">Country</dt><dd className="text-foreground">{(location.country as string) ?? '—'}</dd></div>
          </dl>
          {location.notes && <p className="mt-4 text-sm text-text-secondary border-t border-border pt-4">{location.notes as string}</p>}
        </div>

        <div className="rounded-xl border border-border bg-background p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Linked Events ({eventLinks.length})</h3>
          {eventLinks.length === 0 ? (
            <p className="text-sm text-text-secondary">No events linked to this location.</p>
          ) : (
            <ul className="space-y-2">
              {eventLinks.map((el) => {
                const ev = el.events as { id: string; name: string } | null;
                return (
                  <li key={el.event_id as string} className="flex items-center justify-between text-sm">
                    <Link href={`/app/events/${ev?.id}`} className="text-foreground hover:underline">{ev?.name ?? '—'}</Link>
                    {(el.is_primary as boolean) && <span className="text-xs bg-blue-50 text-blue-700 rounded-full px-1.5 py-0.5">Primary</span>}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </TierGate>
  );
}
