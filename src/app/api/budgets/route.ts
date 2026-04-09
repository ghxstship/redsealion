import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

export async function GET(request: NextRequest) {
  const perm = await checkPermission('budgets', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = request.nextUrl;
  const proposalId = searchParams.get('proposal_id');
  const projectId = searchParams.get('project_id');

  const supabase = await createClient();
  let query = supabase
    .from('project_budgets')
    .select('*, proposals(name), projects(name)')
    .eq('organization_id', perm.organizationId)
    .order('created_at', { ascending: false });

  if (proposalId) query = query.eq('proposal_id', proposalId);
  if (projectId) query = query.eq('project_id', projectId);

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ budgets: data ?? [] });
}

export async function POST(request: NextRequest) {
  const perm = await checkPermission('budgets', 'create');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { proposal_id, project_id, total_budget, alert_threshold_percent, currency } = body as {
    proposal_id?: string;
    project_id?: string;
    total_budget?: number;
    alert_threshold_percent?: number;
    currency?: string;
  };

  if (!proposal_id && !project_id) {
    return NextResponse.json({ error: 'proposal_id or project_id is required' }, { status: 400 });
  }
  if (!total_budget || total_budget <= 0) {
    return NextResponse.json({ error: 'total_budget must be greater than 0' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('project_budgets')
    .insert({
      organization_id: perm.organizationId,
      proposal_id: proposal_id ?? null,
      project_id: project_id ?? null,
      total_budget,
      spent: 0,
      alert_threshold_percent: alert_threshold_percent ?? 80,
      currency: currency || 'USD',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ budget: data }, { status: 201 });
}
