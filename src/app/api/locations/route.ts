import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

export async function GET(request: NextRequest) {
  const perm = await checkPermission('locations', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createClient();
  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const type = url.searchParams.get('type');

  let query = supabase
    .from('locations')
    .select()
    .eq('organization_id', perm.organizationId)
    .order('name');

  if (status) query = query.eq('status', status);
  if (type) query = query.eq('type', type);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'Failed to fetch locations', details: error.message }, { status: 500 });

  return NextResponse.json({ locations: data ?? [] });
}

export async function POST(request: NextRequest) {
  const perm = await checkPermission('locations', 'create');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { name, slug, type, address, formatted_address, phone, timezone, capacity, site_map_url, google_place_id, latitude, longitude, notes } = body as Record<string, unknown>;

  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

  const supabase = await createClient();

  const locationSlug = (slug as string) || (name as string).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const { data: location, error } = await supabase
    .from('locations')
    .insert({
      organization_id: perm.organizationId,
      name: name as string,
      slug: locationSlug,
      type: (type as string) ?? 'venue',
      address: (address as Record<string, unknown>) ?? {},
      formatted_address: (formatted_address as string) ?? null,
      phone: (phone as string) ?? null,
      timezone: (timezone as string) ?? null,
      capacity: (capacity as number) ?? null,
      site_map_url: (site_map_url as string) ?? null,
      google_place_id: (google_place_id as string) ?? null,
      latitude: (latitude as number) ?? null,
      longitude: (longitude as number) ?? null,
      notes: (notes as string) ?? null,
    })
    .select()
    .single();

  if (error || !location) return NextResponse.json({ error: 'Failed to create location', details: error?.message }, { status: 500 });

  return NextResponse.json({ success: true, location }, { status: 201 });
}
