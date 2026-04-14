import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-guard';

export async function GET(request: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;

  const { itemId } = await params;

  // Use the RPC to resolve the full supersession chain
  const { data, error } = await ctx.supabase
    .rpc('resolve_supersession_chain', { p_item_id: itemId });

  if (error) {
    return NextResponse.json({ error: 'Failed to resolve supersession chain', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data || [] });
}
