import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { logAudit } from '@/lib/audit';

/** GET /api/org-chart — List all org chart positions for the organization */
export async function GET() {
  const perm = await checkPermission('team', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('org_chart_positions')
    .select('*, user:users!org_chart_positions_user_id_fkey(id, full_name, avatar_url, title)')
    .eq('organization_id', perm.organizationId)
    .order('level', { ascending: true });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch org chart', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ positions: data ?? [] });
}

/** POST /api/org-chart — Create a new org chart position */
export async function POST(request: NextRequest) {
  const perm = await checkPermission('team', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { title, department, user_id, reports_to, level } = body as {
    title?: string;
    department?: string;
    user_id?: string;
    reports_to?: string;
    level?: number;
  };

  if (!title) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 });
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('org_chart_positions')
    .insert({
      organization_id: perm.organizationId,
      title,
      department: department ?? null,
      user_id: user_id ?? null,
      reports_to: reports_to ?? null,
      level: level ?? 0,
    })
    .select('*, user:users!org_chart_positions_user_id_fkey(id, full_name, avatar_url)')
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Failed to create position', details: error?.message }, { status: 500 });
  }

  await logAudit({ action: 'org_chart.position.created', entityType: 'org_chart_position', entityId: data.id }, supabase);

  return NextResponse.json({ position: data }, { status: 201 });
}
