import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireFeature } from '@/lib/api/tier-guard';
import { requirePermission } from '@/lib/api/permission-guard';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> },
) {
  const { platform } = await params;

  const tierError = await requireFeature('integrations');
  if (tierError) return tierError;

  const permError = await requirePermission('integrations', 'view');
  if (permError) return permError;

  const supabase = await createClient();
  const ctx = await resolveCurrentOrg();

  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: integration } = await supabase
      .from('integrations')
      .select('id, status, config, last_sync_at, sync_enabled')
      .eq('organization_id', ctx.organizationId)
      .eq('platform', platform)
      .single();

    if (!integration) {
      return NextResponse.json({ integration: null });
    }

    return NextResponse.json({ integration });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch integration status' },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> },
) {
  const { platform } = await params;

  const tierError = await requireFeature('integrations');
  if (tierError) return tierError;

  const permError = await requirePermission('integrations', 'edit');
  if (permError) return permError;

  const supabase = await createClient();
  const ctx = await resolveCurrentOrg();

  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const configUpdate = body.config;

    // Fetch existing integration config
    const { data: existing } = await supabase
      .from('integrations')
      .select('id, config')
      .eq('organization_id', ctx.organizationId)
      .eq('platform', platform)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    const mergedConfig = {
      ...(existing.config || {}),
      ...configUpdate,
    };

    // Update config in database
    const { error } = await supabase
      .from('integrations')
      .update({ config: mergedConfig })
      .eq('id', existing.id);

    if (error) throw error;

    return NextResponse.json({ success: true, platform });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update integration settings' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ platform: string }> },
) {
  const { platform } = await params;

  const tierError = await requireFeature('integrations');
  if (tierError) return tierError;

  const permError = await requirePermission('integrations', 'edit');
  if (permError) return permError;

  const supabase = await createClient();
  const ctx = await resolveCurrentOrg();

  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Delete implies a soft-delete or full disconnect
    const { error } = await supabase
      .from('integrations')
      .update({
        status: 'disconnected',
        access_token_encrypted: null,
        refresh_token_encrypted: null,
        token_expires_at: null,
        deleted_at: new Date().toISOString(),
      })
      .eq('organization_id', ctx.organizationId)
      .eq('platform', platform);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Integration disconnected' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to disconnect integration' },
      { status: 500 },
    );
  }
}
