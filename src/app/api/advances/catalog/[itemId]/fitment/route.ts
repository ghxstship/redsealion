import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-guard';

export async function GET(request: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;

  const { itemId } = await params;

  const { data, error } = await ctx.supabase
    .from('advance_catalog_item_fitment')
    .select(`
      id, fit_rating, fit_notes,
      dimension:advance_fitment_dimensions(id, dimension_type, dimension_value, display_label)
    `)
    .eq('catalog_item_id', itemId)
    .order('fit_rating', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch item fitment data', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data || [] });
}
