import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

export async function GET() {
  const perm = await checkPermission('invoices', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('credit_notes')
    .select('*, invoices(invoice_number)')
    .eq('organization_id', perm.organizationId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: NextRequest) {
  const perm = await checkPermission('invoices', 'create');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { invoice_id, amount, reason } = body as { invoice_id?: string; amount?: number; reason?: string };

  if (!invoice_id || !amount) {
    return NextResponse.json({ error: 'invoice_id and amount are required' }, { status: 400 });
  }

  const supabase = await createClient();

  // Generate credit note number
  const { count } = await supabase
    .from('credit_notes')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', perm.organizationId);
  const creditNumber = `CN-${String((count ?? 0) + 1).padStart(4, '0')}`;

  const { data, error } = await supabase
    .from('credit_notes')
    .insert({
      organization_id: perm.organizationId,
      invoice_id,
      credit_number: creditNumber,
      amount,
      reason: reason || null,
      issued_date: new Date().toISOString().slice(0, 10),
      created_by: perm.userId,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
