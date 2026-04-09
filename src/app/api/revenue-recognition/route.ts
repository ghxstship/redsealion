import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

export async function GET() {
  const perm = await checkPermission('invoices', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('revenue_recognition')
    .select('*, proposals(name)')
    .eq('organization_id', perm.organizationId)
    .order('period_start', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entries: data ?? [] });
}

export async function POST(request: NextRequest) {
  const perm = await checkPermission('invoices', 'create');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { proposal_id, period_start, period_end, recognized_amount, deferred_amount, method, notes } = body as {
    proposal_id?: string;
    period_start?: string;
    period_end?: string;
    recognized_amount?: number;
    deferred_amount?: number;
    method?: string;
    notes?: string;
  };

  if (!proposal_id || !period_start || !period_end) {
    return NextResponse.json({ error: 'proposal_id, period_start, and period_end are required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('revenue_recognition')
    .insert({
      organization_id: perm.organizationId,
      proposal_id,
      period_start,
      period_end,
      recognized_amount: recognized_amount ?? 0,
      deferred_amount: deferred_amount ?? 0,
      method: method || 'percentage_of_completion',
      notes: notes || null,
      created_by: perm.userId,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entry: data }, { status: 201 });
}
