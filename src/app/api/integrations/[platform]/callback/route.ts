import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> },
) {
  const { platform } = await params;
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(
      new URL(`/app/integrations?error=${encodeURIComponent(error)}`, request.url),
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/app/integrations?error=missing_code', request.url),
    );
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return NextResponse.redirect(
        new URL('/app/integrations?error=no_org', request.url),
      );
    }

    // Placeholder: Exchange code for tokens using the platform's token endpoint
    // In production, encrypt tokens before storing
    await supabase.from('integrations').upsert(
      {
        organization_id: userData.organization_id,
        platform,
        status: 'connected',
        access_token_encrypted: `placeholder_${code}`,
        config: {},
      },
      { onConflict: 'organization_id,platform' },
    );

    return NextResponse.redirect(
      new URL(`/app/integrations/${platform}?connected=true`, request.url),
    );
  } catch (err) {
    console.error(`OAuth callback error [${platform}]:`, err);
    return NextResponse.redirect(
      new URL('/app/integrations?error=callback_failed', request.url),
    );
  }
}
