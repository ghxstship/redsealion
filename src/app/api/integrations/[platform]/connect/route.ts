import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ platform: string }> },
) {
  const { platform } = await params;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Placeholder: In production, dynamically load the adapter and generate
    // the real OAuth URL with proper client credentials.
    const authUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/integrations/${platform}/callback?state=placeholder`;

    return NextResponse.json({ authUrl, platform });
  } catch (error) {
    console.error(`Integration connect error [${platform}]:`, error);
    return NextResponse.json(
      { error: 'Failed to initiate connection' },
      { status: 500 },
    );
  }
}
