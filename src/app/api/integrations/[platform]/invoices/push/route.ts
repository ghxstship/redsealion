import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
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

    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'No organization' }, { status: 400 });
    }

    const body = await request.json();
    const invoiceIds: string[] = body.invoiceIds ?? [];

    if (invoiceIds.length === 0) {
      return NextResponse.json({ error: 'No invoice IDs provided' }, { status: 400 });
    }

    // Check integration is connected
    const { data: integration } = await supabase
      .from('integrations')
      .select('id, status')
      .eq('organization_id', userData.organization_id)
      .eq('platform', platform)
      .single();

    if (!integration || integration.status !== 'connected') {
      return NextResponse.json(
        { error: `${platform} integration not connected` },
        { status: 400 },
      );
    }

    // Placeholder: In production, fetch invoices and push to accounting platform
    // Log the sync attempt
    await supabase.from('integration_sync_log').insert({
      integration_id: integration.id,
      organization_id: userData.organization_id,
      direction: 'outbound',
      entity_type: 'invoice',
      entity_count: invoiceIds.length,
      status: 'completed',
      completed_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      platform,
      pushed: invoiceIds.length,
    });
  } catch (error) {
    console.error(`Invoice push error [${platform}]:`, error);
    return NextResponse.json({ error: 'Failed to push invoices' }, { status: 500 });
  }
}
