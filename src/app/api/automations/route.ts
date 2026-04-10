import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { requireFeature } from '@/lib/api/tier-guard';

export async function GET(request: NextRequest) {
  const tierError = await requireFeature('automations');
  if (tierError) return tierError;

  const perm = await checkPermission('automations', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createClient();

  const { data: automations, error } = await supabase
    .from('automations')
    .select('*, automation_runs(id, status, created_at)')
    .eq('organization_id', perm.organizationId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: 'Failed to fetch automations' }, { status: 500 });

  return NextResponse.json({ automations: automations ?? [] });
}

export async function POST(request: NextRequest) {
  const tierError = await requireFeature('automations');
  if (tierError) return tierError;

  const perm = await checkPermission('automations', 'create');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { name, description, trigger_type, trigger_config, action_type, action_config } = body as {
    name?: string; description?: string; trigger_type?: string; trigger_config?: Record<string, unknown>;
    action_type?: string; action_config?: Record<string, unknown>;
  };

  if (!name || !trigger_type || !action_type) {
    return NextResponse.json({ error: 'name, trigger_type, and action_type are required' }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: automation, error } = await supabase
    .from('automations')
    .insert({
      organization_id: perm.organizationId,
      name,
      description: description ?? null,
      trigger_type,
      trigger_config: trigger_config ?? {},
      action_type,
      action_config: action_config ?? {},
      is_active: true,
      run_count: 0,
      created_by: perm.userId,
    })
    .select()
    .single();

  if (error || !automation) {
    return NextResponse.json({ error: 'Failed to create automation', details: error?.message }, { status: 500 });
  }

  // Audit log
  await supabase.from('audit_log').insert({
    organization_id: perm.organizationId,
    actor_id: perm.userId,
    entity_type: 'automation',
    entity_id: automation.id,
    action: 'created',
    details: { name, trigger_type, action_type },
  }).then(() => {}, () => {});

  return NextResponse.json({ success: true, automation }, { status: 201 });
}
