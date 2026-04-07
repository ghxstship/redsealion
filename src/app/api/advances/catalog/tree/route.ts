import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-guard';

/**
 * GET /api/advances/catalog/tree — Full taxonomy tree with item counts
 */
export async function GET() {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;

  const orgId = ctx.organizationId;

  // Fetch all hierarchy levels in parallel
  const [groupsRes, catsRes, subcatsRes, countsRes] = await Promise.all([
    ctx.supabase.from('advance_category_groups').select('*').eq('organization_id', orgId).eq('is_active', true).order('sort_order'),
    ctx.supabase.from('advance_categories').select('*').eq('organization_id', orgId).eq('is_active', true).order('sort_order'),
    ctx.supabase.from('advance_subcategories').select('*').eq('organization_id', orgId).eq('is_active', true).order('sort_order'),
    ctx.supabase.from('advance_catalog_items').select('subcategory_id').eq('organization_id', orgId).eq('is_active', true),
  ]);

  const groups = groupsRes.data ?? [];
  const categories = catsRes.data ?? [];
  const subcategories = subcatsRes.data ?? [];
  const items = countsRes.data ?? [];

  // Count items per subcategory
  const countMap: Record<string, number> = {};
  for (const item of items) {
    const subId = (item as Record<string, unknown>).subcategory_id as string;
    countMap[subId] = (countMap[subId] ?? 0) + 1;
  }

  // Build tree
  const tree = groups.map((g: Record<string, unknown>) => ({
    ...g,
    categories: categories
      .filter((c: Record<string, unknown>) => c.group_id === g.id)
      .map((c: Record<string, unknown>) => ({
        ...c,
        subcategories: subcategories
          .filter((s: Record<string, unknown>) => s.category_id === c.id)
          .map((s: Record<string, unknown>) => ({
            ...s,
            item_count: countMap[s.id as string] ?? 0,
          })),
      })),
  }));

  return NextResponse.json({ data: tree });
}
