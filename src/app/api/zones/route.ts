import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/zones — List zones for an event
 * Query params: event_id (required), org_id (required)
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('event_id');
  const orgId = searchParams.get('org_id');

  if (!orgId) return NextResponse.json({ error: 'org_id required' }, { status: 400 });

  let query = supabase
    .from('zones')
    .select('*, events(name), activations(id, name, status, hierarchy_status, space_id, spaces(name, type))')
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true });

  if (eventId) {
    query = query.eq('event_id', eventId);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

/**
 * POST /api/zones — Create a new zone
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { organization_id, event_id, name, slug, type, description, color_hex, sort_order } = body;

  if (!organization_id || !event_id || !name) {
    return NextResponse.json({ error: 'organization_id, event_id, and name are required' }, { status: 400 });
  }

  const zoneSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const { data, error } = await supabase
    .from('zones')
    .insert({
      organization_id,
      event_id,
      name,
      slug: zoneSlug,
      type: type || 'custom',
      status: 'draft',
      description,
      color_hex,
      sort_order: sort_order || 0,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
