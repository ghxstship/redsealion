import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  let redirectUrl = '/';

  try {
    const supabase = await createClient();
    // Look up the campaign by its click_token to get the destination URL
    const { data } = await supabase
      .from('campaigns')
      .select('id, click_destination_url')
      .eq('click_token', token)
      .maybeSingle();

    if (data) {
      if ((data as Record<string, unknown>).click_destination_url) {
        redirectUrl = (data as Record<string, unknown>).click_destination_url as string;
      }
      // Increment click_count via RPC
      await supabase.rpc('increment_campaign_click', { p_token: token });
    }
  } catch {
    // Tracking failure must never block redirect
  }

  return NextResponse.redirect(redirectUrl, { status: 302 });
}
