import { NextRequest, NextResponse } from 'next/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { createClient } from '@/lib/supabase/server';

interface RouteContext { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('crew', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id: crewId } = await context.params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('crew_ratings')
    .select('*, users!crew_ratings_rated_by_fkey(full_name)')
    .eq('crew_profile_id', crewId)
    .eq('organization_id', perm.organizationId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: 'Failed to fetch ratings.', details: error.message }, { status: 500 });
  return NextResponse.json({ ratings: data ?? [] });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('crew', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id: crewId } = await context.params;
  const body = await request.json().catch(() => ({}));
  const { rating, categories, comment, proposal_id, work_order_id } = body;

  if (!rating || rating < 1 || rating > 5) return NextResponse.json({ error: 'rating (1-5) is required.' }, { status: 400 });

  const supabase = await createClient();

  const { data: ratingRow, error } = await supabase
    .from('crew_ratings')
    .insert({
      organization_id: perm.organizationId,
      crew_profile_id: crewId,
      proposal_id: proposal_id || null,
      work_order_id: work_order_id || null,
      rating,
      categories: categories || {},
      comment: comment || null,
      rated_by: perm.userId,
    })
    .select()
    .single();

  if (error || !ratingRow) return NextResponse.json({ error: 'Failed to submit rating.', details: error?.message }, { status: 500 });

  // Update denormalized avg_rating on crew_profiles
  const { data: stats } = await supabase
    .from('crew_ratings')
    .select('rating')
    .eq('crew_profile_id', crewId);

  if (stats && stats.length > 0) {
    const avg = stats.reduce((sum: number, r: Record<string, unknown>) => sum + (r.rating as number), 0) / stats.length;
    await supabase
      .from('crew_profiles')
      .update({ avg_rating: Math.round(avg * 100) / 100, total_ratings: stats.length })
      .eq('id', crewId);
  }

  return NextResponse.json({ success: true, rating: ratingRow });
}
