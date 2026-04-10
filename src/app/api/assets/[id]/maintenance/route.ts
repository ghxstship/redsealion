import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

/**
 * GET /api/assets/[id]/maintenance
 * Returns maintenance schedules and history for a specific asset.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const perm = await checkPermission('assets', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const supabase = await createClient();

  // Fetch maintenance schedules
  const { data: schedules } = await supabase
    .from('maintenance_schedules')
    .select('*')
    .eq('asset_id', id)
    .eq('organization_id', perm.organizationId)
    .order('next_due_date', { ascending: true });

  // Fetch maintenance records via equipment_maintenance_records (if table exists)
  let records: Record<string, unknown>[] = [];
  try {
    const { data } = await supabase
      .from('equipment_maintenance_records')
      .select('*')
      .eq('asset_id', id)
      .order('performed_at', { ascending: false })
      .limit(50);
    records = (data ?? []) as Record<string, unknown>[];
  } catch {
    // Table may not exist; return empty
  }

  return NextResponse.json({
    schedules: schedules ?? [],
    records,
  });
}
