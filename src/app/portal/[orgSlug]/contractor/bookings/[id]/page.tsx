import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import PageHeader from '@/components/shared/PageHeader';
import Card from '@/components/ui/Card';
import StatusBadge, { GENERIC_STATUS_COLORS } from '@/components/ui/StatusBadge';
import Link from 'next/link';

interface BookingDetailProps {
  params: Promise<{ orgSlug: string; id: string }>;
}

export default async function ContractorBookingDetailPage({ params }: BookingDetailProps) {
  const { orgSlug, id } = await params;
  const supabase = await createClient();

  const { data: org } = await supabase.from('organizations').select('id').eq('slug', orgSlug).single();
  if (!org) redirect('/');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/portal/${orgSlug}/login`);

  const { data: profile } = await supabase
    .from('crew_profiles')
    .select('id')
    .eq('user_id', user.id)
    .eq('organization_id', org.id)
    .maybeSingle();

  if (!profile) notFound();

  const { data: booking } = await supabase
    .from('crew_bookings')
    .select('id, role, status, shift_start, shift_end, day_rate, notes, check_in_time, check_out_time, proposals(name, event_start_date, event_end_date)')
    .eq('id', id)
    .eq('crew_profile_id', profile.id)
    .eq('organization_id', org.id)
    .single();

  if (!booking) notFound();

  const proposal = (booking.proposals as unknown) as { name: string; event_start_date: string | null; event_end_date: string | null } | null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={proposal?.name ?? 'Booking Details'}
        subtitle={`${booking.role.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`}
      >
        <Link
          href={`/portal/${orgSlug}/contractor/bookings`}
          className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-bg-secondary"
        >
          Back
        </Link>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Booking details */}
        <Card>
          <h3 className="text-sm font-semibold mb-4">Booking Information</h3>
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-text-muted mb-1">Status</dt>
              <dd><StatusBadge status={booking.status} colorMap={GENERIC_STATUS_COLORS} /></dd>
            </div>
            <div>
              <dt className="text-text-muted mb-1">Role</dt>
              <dd className="text-foreground capitalize">
                {booking.role.split('_').join(' ')}
              </dd>
            </div>
            <div>
              <dt className="text-text-muted mb-1">Shift Start</dt>
              <dd className="text-foreground">
                {new Date(booking.shift_start).toLocaleString('en-US', {
                  weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
                  hour: 'numeric', minute: '2-digit',
                })}
              </dd>
            </div>
            {booking.shift_end && (
              <div>
                <dt className="text-text-muted mb-1">Shift End</dt>
                <dd className="text-foreground">
                  {new Date(booking.shift_end).toLocaleString('en-US', {
                    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
                    hour: 'numeric', minute: '2-digit',
                  })}
                </dd>
              </div>
            )}
            {booking.day_rate && (
              <div>
                <dt className="text-text-muted mb-1">Day Rate</dt>
                <dd className="text-foreground font-semibold">${booking.day_rate.toLocaleString()}</dd>
              </div>
            )}
            {booking.notes && (
              <div>
                <dt className="text-text-muted mb-1">Notes</dt>
                <dd className="text-foreground whitespace-pre-wrap">{booking.notes}</dd>
              </div>
            )}
          </dl>
        </Card>

        {/* Check-in/out */}
        <Card>
          <h3 className="text-sm font-semibold mb-4">Attendance</h3>
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-text-muted mb-1">Check-In</dt>
              <dd className="text-foreground">
                {booking.check_in_time
                  ? new Date(booking.check_in_time).toLocaleString()
                  : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-text-muted mb-1">Check-Out</dt>
              <dd className="text-foreground">
                {booking.check_out_time
                  ? new Date(booking.check_out_time).toLocaleString()
                  : '—'}
              </dd>
            </div>
          </dl>

          {/* Event context */}
          {proposal && (
            <div className="border-t border-border pt-4 mt-6">
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Event</h4>
              <p className="text-sm font-medium text-foreground">{proposal.name}</p>
              {proposal.event_start_date && (
                <p className="text-xs text-text-muted mt-0.5">
                  {new Date(proposal.event_start_date).toLocaleDateString()}
                  {proposal.event_end_date ? ` – ${new Date(proposal.event_end_date).toLocaleDateString()}` : ''}
                </p>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
