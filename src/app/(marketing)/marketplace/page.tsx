import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge, { TASK_PRIORITY_COLORS } from '@/components/ui/StatusBadge';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Job Marketplace | FlyteDeck',
  description: 'Browse open work opportunities from event production companies. Sign up to submit bids and start working.',
  openGraph: {
    title: 'Job Marketplace | FlyteDeck',
    description: 'Find freelance event production work. Browse open jobs and submit bids.',
    type: 'website',
  },
};

interface PublicJob {
  id: string;
  wo_number: string;
  title: string;
  priority: string;
  location_name: string | null;
  scheduled_start: string | null;
  budget_range: string | null;
  bidding_deadline: string | null;
  org_name: string;
  org_slug: string;
}

export default async function PublicMarketplacePage() {
  const supabase = await createClient();

  // Fetch public work orders across all orgs
  const { data } = await supabase
    .from('work_orders')
    .select('id, wo_number, title, priority, location_name, scheduled_start, budget_range, bidding_deadline, organizations(name, slug)')
    .eq('is_public_board', true)
    .is('deleted_at', null)
    .in('status', ['draft', 'dispatched'])
    .order('bidding_deadline', { ascending: true, nullsFirst: false })
    .limit(50);

  const jobs: PublicJob[] = (data ?? []).map((wo: Record<string, unknown>) => {
    const org = wo.organizations as { name: string; slug: string } | null;
    return {
      id: wo.id as string,
      wo_number: wo.wo_number as string,
      title: wo.title as string,
      priority: wo.priority as string,
      location_name: (wo.location_name as string) ?? null,
      scheduled_start: (wo.scheduled_start as string) ?? null,
      budget_range: (wo.budget_range as string) ?? null,
      bidding_deadline: (wo.bidding_deadline as string) ?? null,
      org_name: org?.name ?? 'Unknown',
      org_slug: org?.slug ?? '',
    };
  });

  return (
    <div className="mx-auto max-w-6xl px-6 lg:px-8 py-16">
      {/* Hero */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Job Marketplace
        </h1>
        <p className="mt-4 text-lg text-text-secondary max-w-2xl mx-auto">
          Browse open work opportunities from event production companies.
          Sign up to submit bids and start working.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href="/signup"
            className="rounded-xl bg-foreground px-6 py-3 text-sm font-semibold text-white shadow-md hover:opacity-90 transition-opacity"
          >
            Sign Up to Bid
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-border px-6 py-3 text-sm font-medium text-foreground hover:bg-bg-secondary transition-colors"
          >
            Already a member? Log in
          </Link>
        </div>
      </div>

      {/* Jobs grid */}
      {jobs.length === 0 ? (
        <EmptyState
          message="No open jobs right now"
          description="Check back soon — new opportunities are posted regularly."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => {
            const deadlinePassed = job.bidding_deadline && new Date() > new Date(job.bidding_deadline);

            return (
              <div
                key={job.id}
                className="group rounded-xl border border-border bg-background p-6 hover:border-text-muted hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <StatusBadge status={job.priority} colorMap={TASK_PRIORITY_COLORS} />
                  {deadlinePassed && (
                    <span className="text-xs font-medium text-red-600">Closed</span>
                  )}
                </div>

                <h3 className="text-sm font-semibold text-foreground mb-1 leading-snug">
                  {job.title}
                </h3>
                <p className="text-xs text-text-muted font-mono">{job.wo_number}</p>

                <div className="mt-4 space-y-2 text-xs text-text-secondary">
                  <p>Location: {job.location_name || 'Location TBD'}</p>
                  {job.scheduled_start && (
                    <p>Date: {new Date(job.scheduled_start).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}</p>
                  )}
                  {job.budget_range && (
                    <p>Budget: {job.budget_range}</p>
                  )}
                  {job.bidding_deadline && !deadlinePassed && (
                    <p>Bid by {new Date(job.bidding_deadline).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric',
                    })}</p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                  <span className="text-xs text-text-muted">{job.org_name}</span>
                  <Link
                    href="/signup"
                    className="text-xs font-semibold text-emerald-600 hover:underline"
                  >
                    Sign up to bid →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
