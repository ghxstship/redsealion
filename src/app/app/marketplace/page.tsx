import Link from 'next/link';
import { TierGate } from '@/components/shared/TierGate';
import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { formatLabel } from '@/lib/utils';

import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/shared/PageHeader';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import FormInput from '@/components/ui/FormInput';
import FormSelect from '@/components/ui/FormSelect';
import StatusBadge, { TASK_PRIORITY_COLORS, BID_STATUS_COLORS } from '@/components/ui/StatusBadge';

// #38: Typed interface for work order rows
interface WorkOrderRow {
  id: string;
  wo_number: string;
  title: string;
  priority: string;
  location_name: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  budget_range: string | null;
  bidding_deadline: string | null;
  is_public_board: boolean;
  myBid?: {
    id: string;
    amount: number;
    status: string;
    crew_profile_id: string;
  };
}

interface MarketplaceSearchParams {
  search?: string;
  priority?: string;
  sort?: string;
  page?: string;
}

const PAGE_SIZE = 25;

async function getOpenWorkOrders(params: MarketplaceSearchParams): Promise<{
  data: WorkOrderRow[];
  error: string | null;
  total: number;
}> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return { data: [], error: null, total: 0 };

    const { data: userAuth } = await supabase.auth.getUser();
    if (!userAuth.user) return { data: [], error: 'Not authenticated', total: 0 };

    // Fetch user role to determine if crew profile is required
    const { data: userRecord } = await supabase
      .from('users')
      .select('role')
      .eq('id', userAuth.user.id)
      .single();

    const adminRoles = ['owner', 'admin', 'manager', 'developer'];
    const isAdmin = adminRoles.includes(userRecord?.role ?? '');

    // Check if the current user has a crew profile (optional for admins)
    const { data: profile } = await supabase
      .from('crew_profiles')
      .select('id')
      .eq('user_id', userAuth.user.id)
      .eq('organization_id', ctx.organizationId)
      .maybeSingle();

    // Non-admin users without a crew profile cannot access the marketplace
    if (!profile && !isAdmin) return { data: [], error: 'You must have an active crew profile to access the marketplace.', total: 0 };

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
    const annotatedData: WorkOrderRow[] = (data ?? []).map((wo: Record<string, unknown>) => {
      const bids = wo.work_order_bids as Array<{ crew_profile_id: string; id: string; amount: number; status: string }> | undefined;
      const myBid = profile ? bids?.find((b) => b.crew_profile_id === profile.id) : undefined;
      return {
        id: wo.id as string,
        wo_number: wo.wo_number as string,
        title: wo.title as string,
        priority: wo.priority as string,
        location_name: (wo.location_name as string) ?? null,
        scheduled_start: (wo.scheduled_start as string) ?? null,
        scheduled_end: (wo.scheduled_end as string) ?? null,
        budget_range: (wo.budget_range as string) ?? null,
        bidding_deadline: (wo.bidding_deadline as string) ?? null,
        is_public_board: wo.is_public_board as boolean,
        myBid: myBid ? { id: myBid.id, amount: myBid.amount, status: myBid.status, crew_profile_id: myBid.crew_profile_id } : undefined,
      };
    });

    return { data: annotatedData, error: null, total: count ?? 0 };
  } catch {
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
        <Alert variant="error">{error}</Alert>
      )}

      {/* Filters Bar — #29: Use canonical form components */}
      <form method="GET" action="/app/marketplace" className="flex flex-wrap items-center gap-3 mb-6">
        <FormInput
          type="text"
          name="search"
          defaultValue={params.search || ''}
          placeholder="Search jobs..."
          className="w-64"
        />
        <FormSelect
          name="priority"
          defaultValue={params.priority || ''}
          className="w-auto"
        >
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </FormSelect>
        <FormSelect
          name="sort"
          defaultValue={params.sort || ''}
          className="w-auto"
        >
          <option value="">Sort: Deadline</option>
          <option value="priority">Sort: Priority</option>
        </FormSelect>
        <Button type="submit">
          Search
        </Button>
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
                {workOrders.map((wo) => {
                  return (
                    <tr key={wo.id} className="transition-colors hover:bg-bg-secondary/50">
                      <td className="px-6 py-3.5 text-sm font-mono text-text-muted">{wo.wo_number}</td>
                      <td className="px-6 py-3.5">
                        <Link href={`/app/marketplace/${wo.id}`} className="text-sm font-medium text-foreground hover:underline">
                          {wo.title}
                        </Link>
                      </td>
                      <td className="px-6 py-3.5">
                        <StatusBadge status={wo.priority} colorMap={TASK_PRIORITY_COLORS} />
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
                          <StatusBadge status={wo.myBid.status} colorMap={BID_STATUS_COLORS} className="" />
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
