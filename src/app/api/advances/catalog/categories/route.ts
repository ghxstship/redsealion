import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-guard';

/**
 * GET    /api/advances/catalog/categories — List full taxonomy tree
 * POST   /api/advances/catalog/categories — Create category group, category, or subcategory
 * PATCH  /api/advances/catalog/categories — Update category (by id + type)
 * DELETE /api/advances/catalog/categories — Delete category (by id + type)
 *
 * Gap: H-15 — No management UI or API for the catalog taxonomy
 */

type EntityType = 'group' | 'category' | 'subcategory';
const TABLES: Record<EntityType, string> = {
  group: 'advance_category_groups',
  category: 'advance_categories',
  subcategory: 'advance_subcategories',
};

export async function GET(_request: NextRequest) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;

  const { data, error } = await ctx.supabase
    .from('advance_category_groups')
    .select('*, advance_categories(*, advance_subcategories(*))')
    .eq('organization_id', ctx.organizationId)
    .order('sort_order', { ascending: true });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch categories', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: NextRequest) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;
  const body = await request.json();
  const b = body as Record<string, unknown>;
  const type = (b.type as EntityType) ?? 'group';

  if (!b.name) {
    return NextResponse.json({ error: 'name is required' }, { status: 422 });
  }

  const table = TABLES[type];
  if (!table) {
    return NextResponse.json({ error: 'type must be group, category, or subcategory' }, { status: 422 });
  }

  const insert: Record<string, unknown> = {
    organization_id: ctx.organizationId,
    name: b.name,
    slug: b.slug ?? (b.name as string).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    description: b.description ?? null,
    sort_order: b.sort_order ?? 0,
    metadata: b.metadata ?? {},
  };

  if (type === 'group') {
    insert.icon = b.icon ?? null;
    insert.color_hex = b.color_hex ?? '#6366F1';
  }
  if (type === 'category') {
    insert.group_id = b.group_id;
    if (!b.group_id) return NextResponse.json({ error: 'group_id required for category' }, { status: 422 });
  }
  if (type === 'subcategory') {
    insert.category_id = b.category_id;
    if (!b.category_id) return NextResponse.json({ error: 'category_id required for subcategory' }, { status: 422 });
  }

  const { data, error } = await ctx.supabase
    .from(table)
    .insert(insert)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to create', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;
  const body = await request.json();
  const b = body as Record<string, unknown>;
  const type = (b.type as EntityType) ?? 'group';
  const id = b.id as string;

  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 422 });

  const table = TABLES[type];
  if (!table) return NextResponse.json({ error: 'type must be group, category, or subcategory' }, { status: 422 });

  const allowedFields = ['name', 'slug', 'description', 'sort_order', 'icon', 'color_hex', 'metadata', 'is_active'];
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const f of allowedFields) {
    if (b[f] !== undefined) update[f] = b[f];
  }

  const { data, error } = await ctx.supabase
    .from(table)
    .update(update)
    .eq('id', id)
    .eq('organization_id', ctx.organizationId)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Failed to update', details: error?.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function DELETE(request: NextRequest) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;
  const { searchParams } = request.nextUrl;
  const type = (searchParams.get('type') as EntityType) ?? 'group';
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'id query param required' }, { status: 422 });

  const table = TABLES[type];
  if (!table) return NextResponse.json({ error: 'type must be group, category, or subcategory' }, { status: 422 });

  const { error } = await ctx.supabase
    .from(table)
    .delete()
    .eq('id', id)
    .eq('organization_id', ctx.organizationId);

  if (error) {
    return NextResponse.json({ error: 'Failed to delete', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
