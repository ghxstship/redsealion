import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

interface RouteContext { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('invoices', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('invoice_line_items')
    .select()
    .eq('invoice_id', id)
    .order('sort_order', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ line_items: data ?? [] });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('invoices', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const supabase = await createClient();

  // Verify invoice is still a draft
  const { data: invoice } = await supabase
    .from('invoices')
    .select('id, status')
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .single();

  if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  if (invoice.status !== 'draft') {
    return NextResponse.json({ error: 'Can only modify line items on draft invoices' }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const { description, quantity, rate, tax_rate } = body as {
    description?: string;
    quantity?: number;
    rate?: number;
    tax_rate?: number;
  };

  if (!description) return NextResponse.json({ error: 'description is required' }, { status: 400 });

  const qty = quantity ?? 1;
  const unitRate = rate ?? 0;
  const lineAmount = qty * unitRate;
  const lineTaxRate = tax_rate ?? 0;
  const lineTaxAmount = Math.round(lineAmount * (lineTaxRate / 100) * 100) / 100;

  const { data, error } = await supabase
    .from('invoice_line_items')
    .insert({
      invoice_id: id,
      description,
      quantity: qty,
      rate: unitRate,
      amount: lineAmount,
      tax_rate: lineTaxRate,
      tax_amount: lineTaxAmount,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Recalculate invoice totals
  await recalculateInvoiceTotals(supabase, id);

  return NextResponse.json({ line_item: data }, { status: 201 });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('invoices', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const url = new URL(request.url);
  const lineItemId = url.searchParams.get('line_item_id');

  if (!lineItemId) return NextResponse.json({ error: 'line_item_id query param is required' }, { status: 400 });

  const supabase = await createClient();

  // Verify invoice is still a draft
  const { data: invoice } = await supabase
    .from('invoices')
    .select('id, status')
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .single();

  if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  if (invoice.status !== 'draft') {
    return NextResponse.json({ error: 'Can only modify line items on draft invoices' }, { status: 400 });
  }

  const { error } = await supabase
    .from('invoice_line_items')
    .delete()
    .eq('id', lineItemId)
    .eq('invoice_id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Recalculate invoice totals
  await recalculateInvoiceTotals(supabase, id);

  return NextResponse.json({ success: true });
}

async function recalculateInvoiceTotals(supabase: Awaited<ReturnType<typeof createClient>>, invoiceId: string) {
  const { data: items } = await supabase
    .from('invoice_line_items')
    .select('amount, tax_amount')
    .eq('invoice_id', invoiceId);

  const subtotal = (items ?? []).reduce((s: number, li: Record<string, number>) => s + (li.amount ?? 0), 0);
  const taxAmount = (items ?? []).reduce((s: number, li: Record<string, number>) => s + (li.tax_amount ?? 0), 0);
  const total = subtotal + taxAmount;

  await supabase
    .from('invoices')
    .update({ subtotal, tax_amount: taxAmount, total })
    .eq('id', invoiceId);
}
