import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { createLogger } from '@/lib/logger';
import { logAudit } from '@/lib/audit';

const log = createLogger('api:recruitment');

/**
 * GET /api/recruitment — list recruitment positions
 */
export async function GET() {
  const perm = await checkPermission('crew', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('recruitment_positions')
    .select('*')
    .eq('organization_id', perm.organizationId)
    .order('posted_date', { ascending: false });

  if (error) {
    log.error('Failed to list positions', {}, error);
    return NextResponse.json({ error: 'Failed to list positions' }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

/**
 * POST /api/recruitment — create a recruitment position
 */
export async function POST(request: NextRequest) {
  const perm = await checkPermission('crew', 'create');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const { title, department, description, status } = body;

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('recruitment_positions')
    .insert({
      organization_id: perm.organizationId,
      title,
      department: department ?? 'General',
      description: description ?? null,
      status: status ?? 'open',
    })
    .select()
    .single();

  if (error) {
    log.error('Failed to create position', {}, error);
    return NextResponse.json({ error: 'Failed to create position' }, { status: 500 });
  }

  await logAudit({ action: 'recruitment.position.created', entityType: 'recruitment_position', entityId: data.id }, supabase);

  return NextResponse.json(data, { status: 201 });
}
