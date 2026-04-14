import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-guard';

export async function GET(request: NextRequest) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;

  const url = new URL(request.url);
  const collection = url.searchParams.get('collection');

  let query = ctx.supabase
    .from('advance_fitment_dimensions')
    .select('*')
    .order('dimension_type', { ascending: true })
    .order('sort_order', { ascending: true });

  if (collection) {
    query = query.or(`applicable_collections.eq.{},applicable_collections.cs.{${collection}}`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch fitment dimensions', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data || [] });
}
