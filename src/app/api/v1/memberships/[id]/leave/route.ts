import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SYSTEM_ROLE_IDS } from '@/types/harbor-master';

/**
 * POST /api/v1/memberships/:id/leave — Self-removal with sole-owner guard
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const { data: membership } = await supabase
    .from('organization_memberships')
    .select()
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!membership) {
    return NextResponse.json({ error: 'Membership not found or not yours' }, { status: 404 });
  }

  const orgId = membership.organization_id as string;

  // Sole owner guard: if user is the owner, check if there's another owner
  if (membership.role_id === SYSTEM_ROLE_IDS.OWNER) {
    const { count } = await supabase
      .from('organization_memberships')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('role_id', SYSTEM_ROLE_IDS.OWNER)
      .eq('status', 'active');

    if ((count ?? 0) <= 1) {
      return NextResponse.json(
        { error: 'Cannot leave: you are the sole owner. Transfer ownership first.' },
        { status: 400 },
      );
    }
  }

  const { error } = await supabase.from('organization_memberships').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: 'Failed to leave organization', details: error.message }, { status: 500 });
  }

  // Decrement seat count
  const seatKey = membership.seat_type === 'internal' ? 'internal_seats_used' : 'external_seats_used';
  const { data: alloc } = await supabase
    .from('seat_allocations')
    .select(seatKey)
    .eq('organization_id', orgId)
    .single();

  if (alloc) {
    const current = (alloc as Record<string, number>)[seatKey] ?? 0;
    await supabase
      .from('seat_allocations')
      .update({ [seatKey]: Math.max(0, current - 1) })
      .eq('organization_id', orgId);
  }

  supabase.from('audit_log').insert({
    organization_id: orgId,
    user_id: user.id,
    actor_type: 'user',
    action: 'member.left',
    entity_type: 'membership',
    resource_type: 'membership',
    entity_id: id,
    changes: {},
    metadata: {},
  }).then(() => {});

  return NextResponse.json({ success: true });
}
