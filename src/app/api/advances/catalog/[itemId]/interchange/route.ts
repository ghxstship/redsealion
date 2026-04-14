import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-guard';

export async function GET(request: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;

  const { itemId } = await params;

  // Query bidirectional interchange where either source or target is the item
  // Return the alternative side of the pair
  const { data, error } = await ctx.supabase
    .from('advance_catalog_item_interchange')
    .select(`
      id, relationship_type, compatibility_score, comparison_data, valid_contexts,
      source_item:advance_catalog_items!source_item_id(id, name, item_code, manufacturer),
      target_item:advance_catalog_items!target_item_id(id, name, item_code, manufacturer)
    `)
    .or(`source_item_id.eq.${itemId},and(target_item_id.eq.${itemId},is_bidirectional.eq.true)`)
    .order('compatibility_score', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch interchange records', details: error.message }, { status: 500 });
  }

  // Format to standard response extracting the "alternative" item
  const formatted = data.map((record: any) => {
    const isSource = record.source_item?.id === itemId;
    const alternativeItem = isSource ? record.target_item : record.source_item;
    
    return {
      interchange_id: record.id,
      relationship_type: record.relationship_type,
      compatibility_score: record.compatibility_score,
      comparison_data: record.comparison_data,
      valid_contexts: record.valid_contexts,
      alternative_item: alternativeItem
    };
  });

  return NextResponse.json({ data: formatted });
}
