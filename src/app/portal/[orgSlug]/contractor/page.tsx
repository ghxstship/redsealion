import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Card from '@/components/ui/Card';
import Link from 'next/link';
import StatusBadge, { GENERIC_STATUS_COLORS, BID_STATUS_COLORS } from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import type { Metadata } from 'next';

interface ContractorDashboardProps {
  params: Promise<{ orgSlug: string }>;
}

export async function generateMetadata({ params }: ContractorDashboardProps): Promise<Metadata> {
  const { orgSlug } = await params;
  return { title: `Contractor Dashboard | ${orgSlug}` };
}

export default async function ContractorDashboardPage({ params }: ContractorDashboardProps) {
  const { orgSlug } = await params;
  const supabase = await createClient();

  // Resolve org + user + crew profile
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('slug', orgSlug)
    .single();

  if (!org) redirect('/');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/portal/${orgSlug}/login`);

  const { data: profile } = await supabase
    .from('crew_profiles')
    .select('id, display_name')
    .eq('user_id', user.id)
    .eq('organization_id', org.id)
    .maybeSingle();

  const displayName = profile?.display_name ?? user.user_metadata?.full_name ?? 'Contractor';
  const crewProfileId = profile?.id;

  // Fetch active bookings
  let activeBookings: Array<{ id: string; role: string; status: string; shift_start: string; shift_end: string | null }> = [];
  if (crewProfileId) {
    const { data } = await supabase
      .from('crew_bookings')
      .select('id, role, status, shift_start, shift_end')
      .eq('crew_profile_id', crewProfileId)
      .eq('organization_id', org.id)
      .in('status', ['offered', 'accepted', 'confirmed'])
      .order('shift_start', { ascending: true })
      .limit(5);
    activeBookings = data ?? [];
  }

  // Fetch recent bids
  let recentBids: Array<{ id: string; proposed_amount: number; status: string; work_orders: { title: string } | null }> = [];
  if (crewProfileId) {
    const { data } = await supabase
      .from('work_order_bids')
      .select('id, proposed_amount, status, work_orders(title)')
      .eq('crew_profile_id', crewProfileId)
      .order('created_at', { ascending: false })
      .limit(5);
    recentBids = (data ?? []) as unknown as typeof recentBids;
  }

  // Fetch compliance doc counts
  let complianceCounts = { total: 0, expiring: 0 };
  if (crewProfileId) {
    const { count: total } = await supabase
      .from('compliance_documents')
      .select('id', { count: 'exact', head: true })
      .eq('entity_id', crewProfileId)
      .eq('organization_id', org.id);

    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const { count: expiring } = await supabase
      .from('compliance_documents')
      .select('id', { count: 'exact', head: true })
      .eq('entity_id', crewProfileId)
      .eq('organization_id', org.id)
      .lte('expiry_date', thirtyDaysFromNow)
      .gte('expiry_date', new Date().toISOString());

    complianceCounts = { total: total ?? 0, expiring: expiring ?? 0 };
  }

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Welcome, {displayName}
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          {org.name} — Contractor Portal
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Active Bookings</p>
          <p className="mt-2 text-2xl font-bold text-foreground">{activeBookings.length}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Open Bids</p>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {recentBids.filter(b => b.status === 'pending').length}
          </p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Compliance Docs</p>
          <p className="mt-2 text-2xl font-bold text-foreground">{complianceCounts.total}</p>
          {complianceCounts.expiring > 0 && (
            <p className="mt-1 text-xs text-amber-600 font-medium">
              {complianceCounts.expiring} expiring soon
            </p>
          )}
        </Card>
      </div>

      {/* Upcoming bookings */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            Upcoming Bookings
          </h2>
          <Link
            href={`/portal/${orgSlug}/contractor/bookings`}
            className="text-xs font-medium text-text-muted hover:text-foreground transition-colors"
          >
            View all →
          </Link>
        </div>
        {activeBookings.length === 0 ? (
          <EmptyState message="No upcoming bookings" description="Accepted bookings will appear here." />
        ) : (
          <div className="space-y-2">
            {activeBookings.map((booking) => (
              <Link
                key={booking.id}
                href={`/portal/${orgSlug}/contractor/bookings/${booking.id}`}
                className="block rounded-lg border border-border bg-background p-4 hover:border-text-muted transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {booking.role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {new Date(booking.shift_start).toLocaleDateString('en-US', {
                        weekday: 'short', month: 'short', day: 'numeric',
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
      </section>

      {/* Recent bids */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            Recent Bids
          </h2>
          <Link
            href={`/portal/${orgSlug}/contractor/jobs`}
            className="text-xs font-medium text-text-muted hover:text-foreground transition-colors"
          >
            Browse jobs →
          </Link>
        </div>
        {recentBids.length === 0 ? (
          <EmptyState message="No bids yet" description="Browse the job marketplace to find work." />
        ) : (
          <div className="space-y-2">
            {recentBids.map((bid) => (
              <div
                key={bid.id}
                className="rounded-lg border border-border bg-background p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {bid.work_orders?.title ?? 'Work Order'}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">
                      ${bid.proposed_amount.toLocaleString()}
                    </p>
                  </div>
                  <StatusBadge status={bid.status} colorMap={BID_STATUS_COLORS} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
