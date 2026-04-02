import { NextResponse } from 'next/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const perm = await checkPermission('invoices', 'edit');
  if (!perm) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!perm.allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const supabase = await createClient();

  // Fetch the invoice to validate ownership
  const { data: invoice, error: fetchError } = await supabase
    .from('invoices')
    .select('id, status')
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .single();

  if (fetchError || !invoice) {
    return NextResponse.json(
      { error: 'Invoice not found.' },
      { status: 404 },
    );
  }

  if (invoice.status === 'void') {
    return NextResponse.json(
      { error: 'Invoice is already voided.' },
      { status: 400 },
    );
  }

  const { data: updatedInvoice, error: updateError } = await supabase
    .from('invoices')
    .update({ status: 'void' })
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json(
      { error: 'Failed to void invoice.', details: updateError.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, invoice: updatedInvoice });
}
