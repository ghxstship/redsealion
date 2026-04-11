import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

export async function GET(request: NextRequest) {
  const perm = await checkPermission('invoices', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createClient();
  const proposalId = request.nextUrl.searchParams.get('proposal_id');
  const projectId = request.nextUrl.searchParams.get('project_id');
  const category = request.nextUrl.searchParams.get('category');

  let query = supabase
    .from('project_costs')
    .select('*, proposals(name)')
    .eq('organization_id', perm.organizationId)
    .order('cost_date', { ascending: false });

  if (proposalId) query = query.eq('proposal_id', proposalId);
  if (projectId) query = query.eq('project_id', projectId);
  if (category) query = query.eq('category', category);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ costs: data ?? [] });
}

export async function POST(request: NextRequest) {
  const perm = await checkPermission('invoices', 'create');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { proposal_id, project_id, category, description, amount, cost_date } = body as {
    proposal_id?: string;
    project_id?: string;
    category?: string;
    description?: string;
    amount?: number;
    cost_date?: string;
  };

  if (!category) {
    return NextResponse.json({ error: 'category is required' }, { status: 400 });
  }
  if (!proposal_id && !project_id) {
    return NextResponse.json({ error: 'proposal_id or project_id is required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('project_costs')
    .insert({
      organization_id: perm.organizationId,
      proposal_id: proposal_id ?? null,
      project_id: project_id ?? null,
      category,
      description: description || null,
      amount: amount ?? 0,
      cost_date: cost_date || new Date().toISOString().split('T')[0],
      created_by: perm.userId,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Audit log for financial data change
  await supabase.from('audit_logs').insert({
    organization_id: perm.organizationId,
    actor_id: perm.userId,
    action: 'project_cost_created',
    entity: 'project_cost',
    entity_id: data.id,
    metadata: { category, amount: amount ?? 0, proposal_id, project_id },
  }).select().single().catch(() => {});

  return NextResponse.json({ cost: data }, { status: 201 });
}
