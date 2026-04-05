import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-guard';

/**
 * GET /api/v1/invite-codes/:id/redemptions — Redemption log for a code
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;

  const { id } = await params;

  const { data: redemptions, error } = await ctx.supabase
    .from('invite_code_redemptions')
    .select('*, users!invite_code_redemptions_user_id_fkey(email, display_name)')
    .eq('invite_code_id', id)
    .order('redeemed_at', { ascending: false });

  if (error) return NextResponse.json({ error: 'Failed to fetch redemptions' }, { status: 500 });

  return NextResponse.json({ redemptions: redemptions ?? [] });
}
