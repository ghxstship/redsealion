import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';

/**
 * GET /api/campaigns/analytics
 *
 * Returns aggregated campaign performance data (opens, clicks, rates)
 * for the current organization. Resolves the dangling dependency where
 * /app/campaigns/analytics referenced tracking data but had no dedicated
 * aggregation endpoint.
 *
 * Query params:
 *   - campaign_id (optional): filter to a specific campaign
 *   - period (optional): 'today' | '7d' | '30d' | '90d' | 'all' (default: '30d')
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaign_id');
    const period = searchParams.get('period') || '30d';

    // Calculate date range
    const now = new Date();
    let since: Date | null = null;
    switch (period) {
      case 'today':
        since = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case '7d':
        since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        since = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
        since = null;
        break;
      default:
        since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Fetch campaigns with tracking stats
    let campaignQuery = supabase
      .from('email_campaigns')
      .select('id, name, status, sent_count, open_count, click_count, created_at, sent_at')
      .eq('organization_id', ctx.organizationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (campaignId) {
      campaignQuery = campaignQuery.eq('id', campaignId);
    }
    if (since) {
      campaignQuery = campaignQuery.gte('created_at', since.toISOString());
    }

    const { data: campaigns, error } = await campaignQuery;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Aggregate totals
    const totals = (campaigns ?? []).reduce(
      (acc, c) => {
        acc.total_sent += c.sent_count ?? 0;
        acc.total_opens += c.open_count ?? 0;
        acc.total_clicks += c.click_count ?? 0;
        return acc;
      },
      { total_sent: 0, total_opens: 0, total_clicks: 0 }
    );

    const openRate = totals.total_sent > 0
      ? Math.round((totals.total_opens / totals.total_sent) * 10000) / 100
      : 0;
    const clickRate = totals.total_sent > 0
      ? Math.round((totals.total_clicks / totals.total_sent) * 10000) / 100
      : 0;

    return NextResponse.json({
      period,
      totals: {
        ...totals,
        open_rate: openRate,
        click_rate: clickRate,
      },
      campaigns: (campaigns ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        sent_count: c.sent_count ?? 0,
        open_count: c.open_count ?? 0,
        click_count: c.click_count ?? 0,
        open_rate: (c.sent_count ?? 0) > 0
          ? Math.round(((c.open_count ?? 0) / (c.sent_count ?? 1)) * 10000) / 100
          : 0,
        click_rate: (c.sent_count ?? 0) > 0
          ? Math.round(((c.click_count ?? 0) / (c.sent_count ?? 1)) * 10000) / 100
          : 0,
        sent_at: c.sent_at,
      })),
    });
  } catch {
    return NextResponse.json({ error: 'Failed to load campaign analytics' }, { status: 500 });
  }
}
