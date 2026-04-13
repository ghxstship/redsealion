import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { logAuditAction } from '@/lib/api/audit-logger';

export async function GET(request: NextRequest) {
  const perm = await checkPermission('locations', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createClient();
  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const type = url.searchParams.get('type');
  const search = url.searchParams.get('search');
  const page = parseInt(url.searchParams.get('page') ?? '1', 10);
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '100', 10), 500);
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('locations')
    .select('*', { count: 'exact' })
    .eq('organization_id', perm.organizationId)
    .is('deleted_at', null)
    .order('name')
    .range(from, to);

  if (status) query = query.eq('status', status);
  if (type) query = query.eq('type', type);
  if (search) query = query.or(`name.ilike.%${search}%,formatted_address.ilike.%${search}%`);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: 'Failed to fetch locations', details: error.message }, { status: 500 });

  return NextResponse.json({ locations: data ?? [], total: count ?? 0, page, limit });
}

export async function POST(request: NextRequest) {
  const perm = await checkPermission('locations', 'create');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const {
    name, slug, type, address, formatted_address, phone, timezone, capacity,
    site_map_url, google_place_id, latitude, longitude, notes,
    // Flat address columns (preferred)
    address_line1, address_line2, city, state_province, postal_code, country,
  } = body as Record<string, unknown>;

  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

  const supabase = await createClient();

  // Get current user for audit
  const { data: { user } } = await supabase.auth.getUser();

  // Auto-generate slug with collision handling
  const locationSlug = (slug as string) || (name as string).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  // Build JSONB address from flat fields if address object not provided
  const addressObj = (address as Record<string, unknown>) ?? {};
  if (!address && (address_line1 || city || state_province)) {
    if (address_line1) addressObj.street = address_line1;
    if (city) addressObj.city = city;
    if (state_province) addressObj.state = state_province;
    if (postal_code) addressObj.zip = postal_code;
    if (country) addressObj.country = country;
  }

  // Auto-generate formatted_address if not provided
  const computedFormatted = (formatted_address as string) ||
    [address_line1, city, state_province, postal_code, country].filter(Boolean).join(', ') || null;

  const { data: location, error } = await supabase
    .from('locations')
    .insert({
      organization_id: perm.organizationId,
      name: name as string,
      slug: locationSlug,
      type: (type as string) ?? 'venue',
      address: Object.keys(addressObj).length ? addressObj : {},
      formatted_address: computedFormatted,
      phone: (phone as string) ?? null,
      timezone: (timezone as string) ?? null,
      capacity: (capacity as number) ?? null,
      site_map_url: (site_map_url as string) ?? null,
      google_place_id: (google_place_id as string) ?? null,
      latitude: (latitude as number) ?? null,
      longitude: (longitude as number) ?? null,
      notes: (notes as string) ?? null,
      // Flat address columns
      address_line1: (address_line1 as string) ?? null,
      address_line2: (address_line2 as string) ?? null,
      city: (city as string) ?? null,
      state_province: (state_province as string) ?? null,
      postal_code: (postal_code as string) ?? null,
      country: (country as string) ?? 'US',
      // Audit
      created_by: user?.id ?? null,
    })
    .select()
    .single();

  if (error) {
    // Handle unique slug collision
    if (error.code === '23505' && error.message?.includes('slug')) {
      return NextResponse.json({ error: 'A location with this name/slug already exists. Please use a different name.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create location', details: error.message }, { status: 500 });
  }

  await logAuditAction({
    orgId: perm.organizationId,
    action: 'create', entity: 'location', entityId: location.id,
    metadata: { name: location.name },
  });

  return NextResponse.json({ success: true, location }, { status: 201 });
}
