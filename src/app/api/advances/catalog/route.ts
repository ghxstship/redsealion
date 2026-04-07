import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-guard';

/**
 * GET /api/advances/catalog — Browse catalog items
 */
export async function GET(request: NextRequest) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;

  const { searchParams } = request.nextUrl;
  const groupId = searchParams.get('group_id');
  const categoryId = searchParams.get('category_id');
  const subcategoryId = searchParams.get('subcategory_id');
  const search = searchParams.get('search');
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 100);
  const offset = (page - 1) * limit;

  let query = ctx.supabase
    .from('advance_catalog_items')
    .select(`
      *,
      advance_subcategories!inner(
        id, name, slug,
        advance_categories!inner(
          id, name, slug, group_id,
          advance_category_groups!inner(id, name, slug)
        )
      )
    `, { count: 'exact' })
    .eq('is_active', true);

  // Org-scoped by default
  query = query.eq('organization_id', ctx.organizationId);

  if (subcategoryId) {
    query = query.eq('subcategory_id', subcategoryId);
  } else if (categoryId) {
    query = query.eq('advance_subcategories.category_id', categoryId);
  } else if (groupId) {
    query = query.eq('advance_subcategories.advance_categories.group_id', groupId);
  }

  if (search) {
    query = query.textSearch('search_vector', search, { type: 'websearch' });
  }

  query = query.order('sort_order', { ascending: true }).range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch catalog', details: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data: data ?? [],
    meta: { page, limit, total: count ?? 0 },
  });
}
