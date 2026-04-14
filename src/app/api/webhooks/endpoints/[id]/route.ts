import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireFeature } from '@/lib/api/tier-guard';
import { requirePermission } from '@/lib/api/permission-guard';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

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
    
    // Only allow updating certain fields
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    
    if (body.url !== undefined) updates.url = body.url;
    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.events !== undefined) updates.events = body.events;
    if (body.is_active !== undefined) updates.is_active = body.is_active;
    if (body.secret !== undefined) updates.secret = body.secret;

    const { data, error } = await supabase
      .from('webhook_endpoints')
      .update(updates)
      .eq('id', id)
      .eq('organization_id', ctx.organizationId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (_error) {
    return NextResponse.json(
      { error: 'Failed to update webhook endpoint' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

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
    // Soft delete
    const { error } = await supabase
      .from('webhook_endpoints')
      .update({
        deleted_at: new Date().toISOString(),
        is_active: false,
      })
      .eq('id', id)
      .eq('organization_id', ctx.organizationId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (_error) {
    return NextResponse.json(
      { error: 'Failed to delete webhook endpoint' },
      { status: 500 },
    );
  }
}
