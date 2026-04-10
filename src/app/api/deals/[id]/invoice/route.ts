import { NextResponse } from 'next/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const perm = await checkPermission('pipeline', 'edit');
  if (!perm || !perm.allowed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const supabase = await createClient();
  const orgId = perm.organizationId;

  // 1. Fetch deal details
  const { data: deal } = await supabase
    .from('deals')
    .select('*, client:clients(*)')
    .eq('id', id)
    .eq('organization_id', orgId)
    .single();

  if (!deal) {
    return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
  }

  // 2. Create invoice
  const invBody = {
    organization_id: orgId,
    client_id: deal.client_id,
    amount: deal.deal_value || 0,
    status: 'draft',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: deal.expected_close_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: `Generated from deal: ${deal.title}`,
  };

  const { data: invoice, error } = await supabase
    .from('invoices')
    .insert(invBody)
    .select()
    .single();

  if (error || !invoice) {
    return NextResponse.json({ error: 'Failed to create invoice', details: error?.message }, { status: 500 });
  }

  // 3. Log activity
  await supabase.from('deal_activities').insert({
    deal_id: id,
    organization_id: orgId,
    actor_id: perm.userId,
    type: 'invoice_created',
    description: `Draft invoice created for ${deal.deal_value}`,
  });

  return NextResponse.json({ success: true, invoice });
}
