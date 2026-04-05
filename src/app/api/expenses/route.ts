import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

export async function GET() {
  const perm = await checkPermission('expenses', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createClient();

  const { data: expenses, error } = await supabase
    .from('expenses')
    .select()
    .eq('organization_id', perm.organizationId)
    .order('expense_date', { ascending: false });

  if (error) return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });

  return NextResponse.json({ expenses: expenses ?? [] });
}

export async function POST(request: NextRequest) {
  const perm = await checkPermission('expenses', 'create');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { category, amount, description, expense_date, proposal_id } = body as {
    category?: string;
    amount?: number;
    description?: string;
    expense_date?: string;
    proposal_id?: string;
  };

  if (!category || amount == null || amount <= 0) {
    return NextResponse.json({ error: 'category and a positive amount are required' }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: expense, error } = await supabase
    .from('expenses')
    .insert({
      organization_id: perm.organizationId,
      user_id: perm.userId,
      category,
      amount,
      description: description ?? null,
      expense_date: expense_date ?? new Date().toISOString().split('T')[0],
      proposal_id: proposal_id ?? null,
      status: 'pending',
    })
    .select()
    .single();

  if (error || !expense) {
    return NextResponse.json({ error: 'Failed to create expense', details: error?.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, expense }, { status: 201 });
}
