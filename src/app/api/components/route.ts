import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/components — List components for an activation
 * Query params: activation_id (required), org_id (required)
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const activationId = searchParams.get('activation_id');
  const orgId = searchParams.get('org_id');

  if (!orgId) return NextResponse.json({ error: 'org_id required' }, { status: 400 });

  let query = supabase
    .from('components')
    .select(`
      *,
      activations(id, name, zone_id),
      component_items(
        id, catalog_item_id, catalog_variant_id, quantity,
        unit_price_cents, duration_days, line_total_cents, notes,
        advance_catalog_items(id, name, item_code, subcategory_id,
          advance_subcategories(name, category_id,
            advance_categories(name, group_id,
              advance_category_groups(name, slug, color_hex)
            )
          )
        )
      )
    `)
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true });

  if (activationId) {
    query = query.eq('activation_id', activationId);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

/**
 * POST /api/components — Create a new component
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const {
    organization_id, activation_id, name, slug, type,
    description, overhead_cents, markup_pct, sort_order
  } = body;

  if (!organization_id || !activation_id || !name) {
    return NextResponse.json({ error: 'organization_id, activation_id, and name are required' }, { status: 400 });
  }

  const componentSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const { data, error } = await supabase
    .from('components')
    .insert({
      organization_id,
      activation_id,
      name,
      slug: componentSlug,
      type: type || 'custom',
      status: 'draft',
      description,
      overhead_cents: overhead_cents || 0,
      markup_pct: markup_pct || 0,
      sort_order: sort_order || 0,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
