import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge, { TASK_PRIORITY_COLORS } from '@/components/ui/StatusBadge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import type { Metadata } from 'next';

interface JobsPageProps {
  params: Promise<{ orgSlug: string }>;
}

export async function generateMetadata({ params }: JobsPageProps): Promise<Metadata> {
  const { orgSlug } = await params;
  return { title: `Jobs | ${orgSlug} Contractor Portal` };
}

export default async function ContractorJobsPage({ params }: JobsPageProps) {
  const { orgSlug } = await params;
  const supabase = await createClient();

  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', orgSlug)
    .single();

  if (!org) redirect('/');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/portal/${orgSlug}/login`);

  // Get crew profile for bid matching
  const { data: profile } = await supabase
    .from('crew_profiles')
    .select('id')
    .eq('user_id', user.id)
    .eq('organization_id', org.id)
    .maybeSingle();

  // Fetch public work orders
  const { data: workOrders } = await supabase
    .from('work_orders')
    .select('id, wo_number, title, priority, location_name, scheduled_start, budget_range, bidding_deadline, work_order_bids(id, proposed_amount, status, crew_profile_id)')
    .eq('organization_id', org.id)
    .eq('is_public_board', true)
    .is('deleted_at', null)
    .in('status', ['draft', 'dispatched'])
    .order('bidding_deadline', { ascending: true, nullsFirst: false });

  const jobs = (workOrders ?? []).map((wo: Record<string, unknown>) => {
    const bids = wo.work_order_bids as Array<{ crew_profile_id: string; id: string; proposed_amount: number; status: string }> | undefined;
    const myBid = profile ? bids?.find((b) => b.crew_profile_id === profile.id) : undefined;
    return {
      id: wo.id as string,
      wo_number: wo.wo_number as string,
      title: wo.title as string,
      priority: wo.priority as string,
      location_name: (wo.location_name as string) ?? null,
      scheduled_start: (wo.scheduled_start as string) ?? null,
      budget_range: (wo.budget_range as string) ?? null,
      bidding_deadline: (wo.bidding_deadline as string) ?? null,
      myBid: myBid ? { id: myBid.id, amount: myBid.proposed_amount, status: myBid.status } : undefined,
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Job Marketplace"
        subtitle="Browse open work orders and submit bids."
      />

      {jobs.length === 0 ? (
        <EmptyState
          message="No open jobs"
          description="There are currently no open work orders available."
        />
      ) : (
        <div className="rounded-xl border border-border bg-background overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border bg-bg-secondary">
                  <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Job</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Priority</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Location</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Date</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Budget</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Your Bid</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id} className="transition-colors hover:bg-bg-secondary/50">
                    <TableCell className="px-6 py-3.5">
                      <Link
                        href={`/portal/${orgSlug}/contractor/jobs/${job.id}`}
                        className="text-sm font-medium text-foreground hover:underline"
                      >
                        {job.title}
                      </Link>
                      <p className="text-xs text-text-muted font-mono mt-0.5">{job.wo_number}</p>
                    </TableCell>
                    <TableCell className="px-6 py-3.5">
                      <StatusBadge status={job.priority} colorMap={TASK_PRIORITY_COLORS} />
                    </TableCell>
                    <TableCell className="px-6 py-3.5 text-sm text-text-secondary">
                      {job.location_name || 'TBD'}
                    </TableCell>
                    <TableCell className="px-6 py-3.5 text-sm text-text-muted">
                      {job.scheduled_start
                        ? new Date(job.scheduled_start).toLocaleDateString()
                        : 'TBD'}
                    </TableCell>
                    <TableCell className="px-6 py-3.5 text-sm font-medium text-text-secondary">
                      {job.budget_range || '—'}
                    </TableCell>
                    <TableCell className="px-6 py-3.5">
                      {job.myBid ? (
                        <span className="text-sm text-text-secondary">${job.myBid.amount.toLocaleString()}</span>
                      ) : (
                        <Link
                          href={`/portal/${orgSlug}/contractor/jobs/${job.id}`}
                          className="text-sm font-medium text-emerald-600 hover:underline"
                        >
                          Submit Bid →
                        </Link>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
