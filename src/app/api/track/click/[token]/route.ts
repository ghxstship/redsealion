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
    // Lookup the click token to get the destination URL and campaign id
    const { data } = await supabase
      .from('campaign_click_tokens')
      .select('destination_url, campaign_id')
      .eq('token', token)
      .maybeSingle();

    if (data?.destination_url) {
      redirectUrl = data.destination_url as string;
      // Increment click_count asynchronously
      await supabase.rpc('increment_campaign_click', { p_token: token });
    }
  } catch {
    // Tracking failure must never block redirect
  }

  return NextResponse.redirect(redirectUrl, { status: 302 });
}
