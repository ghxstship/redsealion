import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

const VALID_PROVIDERS = ['google', 'outlook', 'ical'] as const;

export async function GET() {
  const perm = await checkPermission('settings', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createClient();
  const userId = perm.userId;

  const { data: configs, error } = await supabase
    .from('calendar_sync_configs')
    .select('id, provider, calendar_id, sync_enabled, last_synced_at, created_at, updated_at')
    .eq('user_id', userId)
    .order('provider');

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch calendar sync configs.', details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ configs });
}

export async function POST(request: NextRequest) {
  const perm = await checkPermission('settings', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { provider, calendar_id } = body as {
    provider?: string;
    calendar_id?: string;
  };

  if (!provider) {
    return NextResponse.json({ error: 'provider is required.' }, { status: 400 });
  }

  if (!VALID_PROVIDERS.includes(provider as (typeof VALID_PROVIDERS)[number])) {
    return NextResponse.json(
      { error: `Invalid provider. Must be one of: ${VALID_PROVIDERS.join(', ')}` },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const userId = perm.userId;
  const orgId = perm.organizationId;

  // Check if config already exists for this provider
  const { data: existing } = await supabase
    .from('calendar_sync_configs')
    .select('id')
    .eq('user_id', userId)
    .eq('provider', provider)
    .single();

  if (existing) {
    // Update existing config
    const { data: updated, error } = await supabase
      .from('calendar_sync_configs')
      .update({
        sync_enabled: true,
        calendar_id: calendar_id || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update calendar sync config.', details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, config: updated });
  }

  // Create new config
  const { data: config, error } = await supabase
    .from('calendar_sync_configs')
    .insert({
      user_id: userId,
      organization_id: orgId,
      provider,
      calendar_id: calendar_id || null,
      sync_enabled: true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: 'Failed to create calendar sync config.', details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, config });
}

export async function DELETE(request: NextRequest) {
  const perm = await checkPermission('settings', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = request.nextUrl;
  const provider = searchParams.get('provider');

  if (!provider) {
    return NextResponse.json({ error: 'provider query parameter is required.' }, { status: 400 });
  }

  const supabase = await createClient();
  const userId = perm.userId;

  const { error } = await supabase
    .from('calendar_sync_configs')
    .delete()
    .eq('user_id', userId)
    .eq('provider', provider);

  if (error) {
    return NextResponse.json(
      { error: 'Failed to delete calendar sync config.', details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
