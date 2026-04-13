import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge, { GENERIC_STATUS_COLORS } from '@/components/ui/StatusBadge';

interface BookingsPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function ContractorBookingsPage({ params }: BookingsPageProps) {
  const { orgSlug } = await params;
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

  let bookings: Array<{
    id: string; role: string; status: string;
    shift_start: string; shift_end: string | null;
    proposals: { name: string } | null;
  }> = [];

  if (profile) {
    const { data } = await supabase
      .from('crew_bookings')
      .select('id, role, status, shift_start, shift_end, proposals(name)')
      .eq('crew_profile_id', profile.id)
      .eq('organization_id', org.id)
      .order('shift_start', { ascending: false })
      .limit(50);

    bookings = ((data ?? []) as unknown) as typeof bookings;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Bookings"
        subtitle="View and manage your crew bookings."
      />

      {bookings.length === 0 ? (
        <EmptyState message="No bookings yet" description="Bookings from accepted offers will appear here." />
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <Link
              key={booking.id}
              href={`/portal/${orgSlug}/contractor/bookings/${booking.id}`}
              className="block rounded-xl border border-border bg-background p-5 hover:border-text-muted transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {booking.proposals?.name ?? 'Booking'}
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Role: {booking.role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {new Date(booking.shift_start).toLocaleDateString('en-US', {
                      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
                    })}
                    {booking.shift_end && (
                      <> — {new Date(booking.shift_end).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</>
                    )}
                  </p>
                </div>
                <StatusBadge status={booking.status} colorMap={GENERIC_STATUS_COLORS} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
