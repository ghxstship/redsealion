import { NextRequest, NextResponse } from 'next/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { createClient } from '@/lib/supabase/server';

interface RouteContext { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('email_campaigns', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const supabase = await createClient();

  const { data: campaign, error } = await supabase
    .from('campaigns')
    .select('*, campaign_recipients(*)')
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .single();

  if (error || !campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  return NextResponse.json({ campaign });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('email_campaigns', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const supabase = await createClient();

  const allowedFields = ['name', 'subject', 'body_html', 'body_text', 'target_tags', 'target_all_clients', 'status', 'scheduled_at'];
  const updates: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) updates[field] = body[field];
  }

  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });

  const { data: campaign, error } = await supabase
    .from('campaigns')
    .update(updates)
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .select()
    .single();

  if (error || !campaign) return NextResponse.json({ error: 'Failed to update campaign', details: error?.message }, { status: 500 });
  return NextResponse.json({ success: true, campaign });
}
