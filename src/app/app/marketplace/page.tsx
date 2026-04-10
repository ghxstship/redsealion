import Link from 'next/link';
import { TierGate } from '@/components/shared/TierGate';
import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';

import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/shared/PageHeader';

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-bg-secondary text-text-muted',
  medium: 'bg-blue-50 text-blue-700',
  high: 'bg-orange-50 text-orange-700',
  urgent: 'bg-red-50 text-red-700',
};

const BID_STATUS_COLORS: Record<string, string> = {
  accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  withdrawn: 'bg-gray-100 text-gray-800',
  pending: 'bg-blue-100 text-blue-800',
};

function formatLabel(s: string): string {
  return s.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

interface MarketplaceSearchParams {
  search?: string;
  priority?: string;
  sort?: string;
  page?: string;
}

const PAGE_SIZE = 25;

async function getOpenWorkOrders(params: MarketplaceSearchParams): Promise<{
  data: Array<Record<string, unknown>>;
  error: string | null;
  total: number;
}> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return { data: [], error: null, total: 0 };

    const { data: userAuth } = await supabase.auth.getUser();
    if (!userAuth.user) return { data: [], error: 'Not authenticated', total: 0 };

    // Check if the current user has a crew profile
    const { data: profile } = await supabase
      .from('crew_profiles')
      .select('id')
      .eq('user_id', userAuth.user.id)
      .eq('organization_id', ctx.organizationId)
      .single();

    if (!profile) return { data: [], error: 'You must have an active crew profile to access the marketplace.', total: 0 };

    let query = supabase
      .from('work_orders')
      .select('*, work_order_bids(id, amount:proposed_amount, status, crew_profile_id)', { count: 'exact' })
      .eq('organization_id', ctx.organizationId)
      .eq('is_public_board', true)
      .is('deleted_at', null)
      .in('status', ['draft', 'dispatched']);

    // Search filter
    if (params.search) {
      query = query.or(`title.ilike.%${params.search}%,wo_number.ilike.%${params.search}%,location_name.ilike.%${params.search}%`);
    }

    // Priority filter
    if (params.priority && ['low', 'medium', 'high', 'urgent'].includes(params.priority)) {
      query = query.eq('priority', params.priority);
    }

    // Sort
    const sortField = params.sort === 'priority' ? 'priority' : 'bidding_deadline';
    const sortAsc = params.sort !== 'priority';
    query = query.order(sortField, { ascending: sortAsc, nullsFirst: false });

    // Pagination
    const page = Math.max(1, parseInt(params.page || '1', 10) || 1);
    const offset = (page - 1) * PAGE_SIZE;
    query = query.range(offset, offset + PAGE_SIZE - 1);

    const { data, error, count } = await query;

    if (error) return { data: [], error: error.message, total: 0 };
    
    // Tag each row with current user's bid if they have one
    const annotatedData = (data ?? []).map((wo: any) => {
      const myBid = wo.work_order_bids?.find((b: any) => b.crew_profile_id === profile.id);
      return { ...wo, myBid };
    });

    return { data: annotatedData, error: null, total: count ?? 0 };
  } catch (err: any) {
    return { data: [], error: 'Failed to load marketplace jobs.', total: 0 };
  }
}

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<MarketplaceSearchParams>;
}) {
  const params = await searchParams;
  const { data: workOrders, error, total } = await getOpenWorkOrders(params);
  const currentPage = Math.max(1, parseInt(params.page || '1', 10) || 1);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function buildUrl(overrides: Partial<MarketplaceSearchParams>): string {
    const merged = { ...params, ...overrides };
    const qs = new URLSearchParams();
    if (merged.search) qs.set('search', merged.search);
    if (merged.priority) qs.set('priority', merged.priority);
    if (merged.sort) qs.set('sort', merged.sort);
    if (merged.page && merged.page !== '1') qs.set('page', merged.page);
    const s = qs.toString();
    return s ? `/app/marketplace?${s}` : '/app/marketplace';
  }

  return (
    <TierGate feature="work_orders">
      <PageHeader
        title="Job Marketplace"
        subtitle="Browse and bid on open work orders."
      />

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Filters Bar */}
      <form method="GET" action="/app/marketplace" className="flex flex-wrap items-center gap-3 mb-6">
        <input
          type="text"
          name="search"
          defaultValue={params.search || ''}
          placeholder="Search jobs..."
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm w-64 focus:outline-none focus:border-foreground/30"
        />
        <select
          name="priority"
          defaultValue={params.priority || ''}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:border-foreground/30"
        >
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
        <select
          name="sort"
          defaultValue={params.sort || ''}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:border-foreground/30"
        >
          <option value="">Sort: Deadline</option>
          <option value="priority">Sort: Priority</option>
        </select>
        <button
          type="submit"
          className="rounded-lg bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Search
        </button>
        {(params.search || params.priority || params.sort) && (
          <Link
            href="/app/marketplace"
            className="text-sm text-text-muted hover:text-foreground transition-colors"
          >
            Clear
          </Link>
        )}
      </form>

      {/* Work order list */}
      <div className="rounded-xl border border-border bg-background overflow-hidden">
        {workOrders.length === 0 ? (
          <EmptyState
            message="No active jobs"
            description="There are currently no open work orders matching your criteria."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-bg-secondary">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Job ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Dates</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Budget</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Your Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {workOrders.map((wo: any) => {
                  return (
                    <tr key={wo.id} className="transition-colors hover:bg-bg-secondary/50">
                      <td className="px-6 py-3.5 text-sm font-mono text-text-muted">{wo.wo_number}</td>
                      <td className="px-6 py-3.5">
                        <Link href={`/app/marketplace/${wo.id}`} className="text-sm font-medium text-foreground hover:underline">
                          {wo.title}
                        </Link>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${PRIORITY_COLORS[wo.priority] || ''}`}>
                          {formatLabel(wo.priority)}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-text-secondary">
                        {wo.location_name || 'TBD'}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-text-muted">
                        {wo.scheduled_start
                          ? new Date(wo.scheduled_start).toLocaleDateString()
                          : 'TBD'}
                      </td>
                      <td className="px-6 py-3.5 text-sm font-medium text-text-secondary">
                        {wo.budget_range || 'Not specified'}
                      </td>
                      <td className="px-6 py-3.5 text-sm">
                        {wo.myBid ? (
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${BID_STATUS_COLORS[wo.myBid.status] || 'bg-blue-100 text-blue-800'}`}>
                            {formatLabel(wo.myBid.status)} (${wo.myBid.amount})
                          </span>
                        ) : (
                          <Link href={`/app/marketplace/${wo.id}`} className="text-blue-600 hover:underline">
                            Submit Bid &rarr;
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-text-muted">
          <span>
            Showing {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, total)} of {total} jobs
          </span>
          <div className="flex gap-2">
            {currentPage > 1 && (
              <Link
                href={buildUrl({ page: String(currentPage - 1) })}
                className="rounded-lg border border-border px-3 py-1.5 hover:bg-bg-secondary transition-colors"
              >
                ← Previous
              </Link>
            )}
            {currentPage < totalPages && (
              <Link
                href={buildUrl({ page: String(currentPage + 1) })}
                className="rounded-lg border border-border px-3 py-1.5 hover:bg-bg-secondary transition-colors"
              >
                Next →
              </Link>
            )}
          </div>
        </div>
      )}
    </TierGate>
  );
}
