import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/v1/invite-codes/:id/redemptions — Redemption log for a code
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const { data: redemptions, error } = await supabase
    .from('invite_code_redemptions')
    .select('*, users!invite_code_redemptions_user_id_fkey(email, display_name)')
    .eq('invite_code_id', id)
    .order('redeemed_at', { ascending: false });

  if (error) return NextResponse.json({ error: 'Failed to fetch redemptions' }, { status: 500 });

  return NextResponse.json({ redemptions: redemptions ?? [] });
}
