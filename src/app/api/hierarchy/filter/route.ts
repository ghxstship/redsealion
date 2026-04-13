import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/hierarchy/filter — Cross-cutting vertical filter
 * Returns all L6 items within a hierarchy scope matching catalog taxonomy filters.
 *
 * Query params:
 *   scope_type: 'project' | 'event' | 'zone' | 'activation' (required)
 *   scope_id: UUID (required)
 *   group_slug: e.g. 'technical' (optional)
 *   category_slug: e.g. 'audio' (optional)
 *   subcategory_slug: e.g. 'pa-systems' (optional)
 *
 * Example:
 *   /api/hierarchy/filter?scope_type=event&scope_id=abc&group_slug=technical
 *   → "Show me ALL Technical items across every Zone for this Event"
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const scopeType = searchParams.get('scope_type');
  const scopeId = searchParams.get('scope_id');
  const groupSlug = searchParams.get('group_slug') || null;
  const categorySlug = searchParams.get('category_slug') || null;
  const subcategorySlug = searchParams.get('subcategory_slug') || null;

  if (!scopeType || !scopeId) {
    return NextResponse.json({ error: 'scope_type and scope_id required' }, { status: 400 });
  }

  const validScopes = ['project', 'event', 'zone', 'activation'];
  if (!validScopes.includes(scopeType)) {
    return NextResponse.json({
      error: `scope_type must be one of: ${validScopes.join(', ')}`
    }, { status: 400 });
  }

  const { data, error } = await supabase.rpc('hierarchy_items_by_vertical', {
    p_scope_type: scopeType,
    p_scope_id: scopeId,
    p_group_slug: groupSlug,
    p_category_slug: categorySlug,
    p_subcategory_slug: subcategorySlug,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Group results by collection group for UI consumption
  const grouped: Record<string, {
    group_name: string;
    group_slug: string;
    group_color: string;
    total_items: number;
    total_cents: number;
    items: typeof data;
  }> = {};

  for (const item of (data || [])) {
    const key = item.group_slug;
    if (!grouped[key]) {
      grouped[key] = {
        group_name: item.group_name,
        group_slug: item.group_slug,
        group_color: item.group_color,
        total_items: 0,
        total_cents: 0,
        items: [],
      };
    }
    grouped[key].total_items += item.quantity;
    grouped[key].total_cents += item.line_total_cents || 0;
    grouped[key].items.push(item);
  }

  return NextResponse.json({
    scope_type: scopeType,
    scope_id: scopeId,
    filters: { group_slug: groupSlug, category_slug: categorySlug, subcategory_slug: subcategorySlug },
    total_items: data?.length || 0,
    by_vertical: grouped,
    items: data,
  });
}
