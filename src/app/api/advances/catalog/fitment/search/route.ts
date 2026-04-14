import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-guard';

export async function POST(request: NextRequest) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;

  const body = await request.json();
  const { 
    collection, 
    venue_type, 
    event_scale, 
    environment, 
    budget_tier, 
    use_case, 
    min_rating = 3 
  } = body;

  const { data, error } = await ctx.supabase
    .rpc('get_items_by_fitment', {
      p_collection: collection || null,
      p_venue_type: venue_type || null,
      p_event_scale: event_scale || null,
      p_environment: environment || null,
      p_budget_tier: budget_tier || null,
      p_use_case: use_case || null,
      p_min_rating: min_rating
    });

  if (error) {
    return NextResponse.json({ error: 'Failed to execute fitment search', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data || [] });
}
