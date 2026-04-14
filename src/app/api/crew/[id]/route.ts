import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { logAudit } from '@/lib/audit';
import { dispatchWebhook } from '@/lib/webhooks/dispatch';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const perm = await checkPermission('crew', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from('crew_profiles')
    .select('*, user:users(*), crew_bookings(*), crew_availability(*)')
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .single();

  if (error || !profile) return NextResponse.json({ error: 'Crew profile not found' }, { status: 404 });

  return NextResponse.json({ profile });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const perm = await checkPermission('crew', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const supabase = await createClient();

  const allowedFields = [
    'full_name', 'bio', 'phone', 'skills', 'certifications',
    'hourly_rate', 'day_rate', 'ot_rate',
    'per_diem_rate', 'travel_rate', 'availability_default', 'availability_status',
    'emergency_contact_name', 'emergency_contact_phone', 'notes', 'status',
    'onboarding_status',
  ];
  const updates: Record<string, unknown> = {};
  for (const f of allowedFields) {
    if (f in body) updates[f] = body[f];
  }
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });

  const { data: profile, error } = await supabase
    .from('crew_profiles')
    .update(updates)
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .select()
    .single();

  if (error || !profile) return NextResponse.json({ error: 'Failed to update', details: error?.message }, { status: 500 });

  await logAudit({ action: 'crew.profile.updated', entityType: 'crew_profile', entityId: id, metadata: updates }, supabase);
  await dispatchWebhook('crew.updated', profile, perm.organizationId).catch(() => {});

  return NextResponse.json({ success: true, profile });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const perm = await checkPermission('crew', 'delete');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const supabase = await createClient();

  // Guard: check for active bookings or open work order assignments
  const [bookingsRes, assignmentsRes] = await Promise.all([
    supabase
      .from('crew_bookings')
      .select('id', { count: 'exact', head: true })
      .eq('crew_profile_id', id)
      .in('status', ['confirmed', 'tentative']),
    supabase
      .from('work_order_assignments')
      .select('work_order_id', { count: 'exact', head: true })
      .eq('crew_profile_id', id),
  ]);

  if ((bookingsRes.count ?? 0) > 0) {
    return NextResponse.json(
      { error: 'Cannot delete crew member with active bookings. Reassign or cancel their bookings first.' },
      { status: 409 }
    );
  }
  if ((assignmentsRes.count ?? 0) > 0) {
    return NextResponse.json(
      { error: 'Cannot delete crew member assigned to work orders. Remove assignments first.' },
      { status: 409 }
    );
  }

  const { error } = await supabase.from('crew_profiles').delete().eq('id', id).eq('organization_id', perm.organizationId);
  if (error) return NextResponse.json({ error: 'Failed to delete', details: error.message }, { status: 500 });

  await logAudit({ action: 'crew.profile.deleted', entityType: 'crew_profile', entityId: id }, supabase);
  await dispatchWebhook('crew.deleted', { id }, perm.organizationId).catch(() => {});

  return NextResponse.json({ success: true });
}
