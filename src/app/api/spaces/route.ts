import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/spaces — List spaces for a location
 * Query params: location_id (required), org_id (required)
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const locationId = searchParams.get('location_id');
  const orgId = searchParams.get('org_id');

  if (!orgId) return NextResponse.json({ error: 'org_id required' }, { status: 400 });

  let query = supabase
    .from('spaces')
    .select('*, locations(name, formatted_address)')
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true });

  if (locationId) {
    query = query.eq('location_id', locationId);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

/**
 * POST /api/spaces — Create a new space within a location
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const {
    organization_id, location_id, name, slug, type, description,
    capacity, area_sqft, floor_plan_url, floor_level, environment,
    has_power, has_water, has_wifi, infrastructure_notes, sort_order
  } = body;

  if (!organization_id || !location_id || !name) {
    return NextResponse.json({ error: 'organization_id, location_id, and name are required' }, { status: 400 });
  }

  const spaceSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const { data, error } = await supabase
    .from('spaces')
    .insert({
      organization_id,
      location_id,
      name,
      slug: spaceSlug,
      type: type || 'custom',
      description,
      capacity,
      area_sqft,
      floor_plan_url,
      floor_level,
      environment: environment || 'indoor',
      has_power: has_power || false,
      has_water: has_water || false,
      has_wifi: has_wifi || false,
      infrastructure_notes,
      sort_order: sort_order || 0,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
