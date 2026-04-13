import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/zones/[id] — Get a single zone with its activations
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const { data, error } = await supabase
    .from('zones')
    .select(`
      *,
      events(id, name, slug, starts_at, ends_at),
      activations(
        id, name, type, status, hierarchy_status, sort_order,
        space_id, spaces(id, name, type, capacity, area_sqft),
        components(id, name, type, status, sort_order)
      )
    `)
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });

  return NextResponse.json(data);
}

/**
 * PATCH /api/zones/[id] — Update a zone
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  // Only allow specific fields to be updated
  const allowedFields = [
    'name', 'slug', 'type', 'status', 'description', 'color_hex',
    'sort_order', 'overhead_cents', 'markup_pct',
  ];
  const updates: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (body[key] !== undefined) updates[key] = body[key];
  }

  // Track status changes
  if (body.status || body.hierarchy_status) {
    updates.status_changed_at = new Date().toISOString();
    updates.status_changed_by = user.id;
  }

  const { data, error } = await supabase
    .from('zones')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

/**
 * DELETE /api/zones/[id] — Soft-delete a zone
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const { error } = await supabase
    .from('zones')
    .update({ deleted_at: new Date().toISOString(), deleted_by: user.id })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
