import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { createLogger } from '@/lib/logger';
import { logAudit } from '@/lib/audit';

const log = createLogger('api:crew:ratings:item');

interface RouteContext { params: Promise<{ id: string; ratingId: string }> }

/**
 * PATCH /api/crew/[id]/ratings/[ratingId]
 * Update a crew rating.
 */
export async function PATCH(request: Request, context: RouteContext) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const perm = await checkPermission('crew', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id, ratingId } = await context.params;
  const body = await request.json();
  const { rating, category, comment } = body;

  if (rating !== undefined && (typeof rating !== 'number' || rating < 1 || rating > 5)) {
    return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 });
  }

  const supabase = await createClient();
  const update: Record<string, unknown> = {};
  if (rating !== undefined) update.rating = rating;
  if (category !== undefined) update.category = category;
  if (comment !== undefined) update.comment = comment;

  const { data, error } = await supabase
    .from('crew_ratings')
    .update(update)
    .eq('id', ratingId)
    .eq('crew_profile_id', id)
    .select()
    .single();

  if (error || !data) {
    log.error('Failed to update rating', { ratingId }, error);
    return NextResponse.json({ error: 'Failed to update rating' }, { status: 500 });
  }

  await logAudit({ action: 'crew.rating.updated', entityType: 'crew_rating', entityId: ratingId, metadata: update }, supabase);

  return NextResponse.json(data);
}

/**
 * DELETE /api/crew/[id]/ratings/[ratingId]
 * Delete a crew rating.
 */
export async function DELETE(_request: Request, context: RouteContext) {
  const perm = await checkPermission('crew', 'delete');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id, ratingId } = await context.params;
  const supabase = await createClient();

  const { error } = await supabase
    .from('crew_ratings')
    .delete()
    .eq('id', ratingId)
    .eq('crew_profile_id', id);

  if (error) {
    log.error('Failed to delete rating', { ratingId }, error);
    return NextResponse.json({ error: 'Failed to delete rating' }, { status: 500 });
  }

  await logAudit({ action: 'crew.rating.deleted', entityType: 'crew_rating', entityId: ratingId }, supabase);

  return NextResponse.json({ success: true });
}
