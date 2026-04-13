import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { createLogger } from '@/lib/logger';
import { logAudit } from '@/lib/audit';

const log = createLogger('api:crew:bookings:item');

interface RouteContext { params: Promise<{ id: string; bookingId: string }> }

/**
 * PATCH /api/crew/[id]/bookings/[bookingId]
 * Update booking status, shift times, or rate.
 */
export async function PATCH(request: Request, context: RouteContext) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const perm = await checkPermission('crew', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id, bookingId } = await context.params;
  const body = await request.json();

  const allowedFields = ['status', 'shift_start', 'shift_end', 'rate', 'rate_type', 'role', 'notes'];
  const update: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (body[key] !== undefined) update[key] = body[key];
  }

  if (update.status && ['accepted', 'declined', 'confirmed'].includes(update.status as string)) {
    update.responded_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('crew_bookings')
    .update(update)
    .eq('id', bookingId)
    .eq('crew_profile_id', id)
    .is('deleted_at', null)
    .select()
    .single();

  if (error || !data) {
    log.error('Failed to update booking', { bookingId }, error);
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
  }

  await logAudit({ action: 'crew.booking.updated', entityType: 'crew_booking', entityId: bookingId, metadata: update }, supabase);

  return NextResponse.json(data);
}

/**
 * DELETE /api/crew/[id]/bookings/[bookingId]
 * Soft-delete a booking.
 */
export async function DELETE(_request: Request, context: RouteContext) {
  const perm = await checkPermission('crew', 'delete');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id, bookingId } = await context.params;
  const supabase = await createClient();

  const { error } = await supabase
    .from('crew_bookings')
    .update({ deleted_at: new Date().toISOString(), status: 'cancelled' })
    .eq('id', bookingId)
    .eq('crew_profile_id', id)
    .is('deleted_at', null);

  if (error) {
    log.error('Failed to soft-delete booking', { bookingId }, error);
    return NextResponse.json({ error: 'Failed to cancel booking' }, { status: 500 });
  }

  await logAudit({ action: 'crew.booking.cancelled', entityType: 'crew_booking', entityId: bookingId }, supabase);

  return NextResponse.json({ success: true });
}
