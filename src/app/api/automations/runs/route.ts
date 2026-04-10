import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { requireFeature } from '@/lib/api/tier-guard';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { castRelation } from '@/lib/supabase/cast-relation';

/**
 * Automation runs API — surfaces execution history.
 */
export async function GET(request: NextRequest) {
  const tierError = await requireFeature('automations');
  if (tierError) return tierError;

  const perm = await checkPermission('automations', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const ctx = await resolveCurrentOrg();
  if (!ctx) return NextResponse.json({ error: 'No org' }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const automationId = searchParams.get('automation_id');
  const limit = parseInt(searchParams.get('limit') ?? '20');

  const supabase = await createClient();

  let query = supabase
    .from('automation_runs')
    .select('*, automations(name)')
    .eq('organization_id', ctx.organizationId)
    .order('started_at', { ascending: false })
    .limit(Math.min(limit, 100));

  if (automationId) {
    query = query.eq('automation_id', automationId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ runs: [] });
  }

  const runs = (data ?? []).map((row) => {
    const automation = castRelation<{ name: string }>(row.automations);
    return {
      id: row.id,
      automation_name: automation?.name ?? null,
      status: row.status,
      trigger_data: row.trigger_data,
      started_at: row.started_at,
      completed_at: row.completed_at,
      error_message: row.error ?? null,
    };
  });

  return NextResponse.json({ runs });
}
