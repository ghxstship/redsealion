import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const perm = await checkPermission('events', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id: event_id } = await params;
  const body = await request.json().catch(() => ({}));
  const { location_id, is_primary, notes, load_in_time, load_out_time } = body as Record<string, unknown>;

  if (!location_id) {
    return NextResponse.json({ error: 'location_id is required' }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: eventLocation, error } = await supabase
    .from('event_locations')
    .insert({
      event_id,
      location_id: location_id as string,
      is_primary: Boolean(is_primary),
      notes: (notes as string) ?? null,
      load_in_time: (load_in_time as string) ?? null,
      load_out_time: (load_out_time as string) ?? null,
    })
    .eq('organization_id', perm!.organizationId)
    .select()
    .single();

  if (error || !eventLocation) {
    return NextResponse.json({ error: 'Failed to link location to event', details: error?.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, eventLocation }, { status: 201 });
}
