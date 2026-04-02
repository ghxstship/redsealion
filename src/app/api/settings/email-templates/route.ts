import { NextRequest, NextResponse } from 'next/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const perm = await checkPermission('settings', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('email_templates')
    .select('id, event_type, subject_template, body_template, enabled, created_at, updated_at')
    .eq('organization_id', perm.organizationId)
    .order('event_type');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ templates: data });
}

export async function PUT(request: NextRequest) {
  const perm = await checkPermission('settings', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const { event_type, subject_template, body_template, enabled } = body;

  if (!event_type) {
    return NextResponse.json({ error: 'event_type is required' }, { status: 400 });
  }

  const supabase = await createClient();
  const now = new Date().toISOString();

  const upsertData: Record<string, unknown> = {
    organization_id: perm.organizationId,
    event_type,
    updated_at: now,
  };

  if (subject_template !== undefined) upsertData.subject_template = subject_template;
  if (body_template !== undefined) upsertData.body_template = body_template;
  if (enabled !== undefined) upsertData.enabled = enabled;

  const { data, error } = await supabase
    .from('email_templates')
    .upsert(upsertData, { onConflict: 'organization_id,event_type' })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ template: data });
}
