import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/public/marketplace
 *
 * Public API endpoint (no auth required) serving published work orders.
 * Enforces is_public_board = true and deleted_at IS NULL.
 *
 * Query params:
 *   - org_slug (optional): filter to a specific org
 *   - limit (optional): max results (default: 25, max: 100)
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const orgSlug = searchParams.get('org_slug');
    const limit = Math.min(parseInt(searchParams.get('limit') || '25', 10), 100);

    let query = supabase
      .from('work_orders')
      .select('id, wo_number, title, priority, location_name, scheduled_start, budget_range, bidding_deadline, organizations(name, slug)')
      .eq('is_public_board', true)
      .is('deleted_at', null)
      .in('status', ['draft', 'dispatched'])
      .order('bidding_deadline', { ascending: true, nullsFirst: false })
      .limit(limit);

    // Optionally filter by org
    if (orgSlug) {
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', orgSlug)
        .single();

      if (org) {
        query = query.eq('organization_id', org.id);
      } else {
        return NextResponse.json({ jobs: [], total: 0 });
      }
    }

    const { data, count } = await query;

    const jobs = (data ?? []).map((wo: Record<string, unknown>) => {
      const org = wo.organizations as { name: string; slug: string } | null;
      return {
        id: wo.id,
        wo_number: wo.wo_number,
        title: wo.title,
        priority: wo.priority,
        location_name: wo.location_name ?? null,
        scheduled_start: wo.scheduled_start ?? null,
        budget_range: wo.budget_range ?? null,
        bidding_deadline: wo.bidding_deadline ?? null,
        org_name: org?.name ?? null,
        org_slug: org?.slug ?? null,
      };
    });

    return NextResponse.json({ jobs, total: count ?? jobs.length });
  } catch {
    return NextResponse.json({ error: 'Failed to load marketplace' }, { status: 500 });
  }
}
