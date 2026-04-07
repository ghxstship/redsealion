import { NextRequest, NextResponse } from 'next/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const perm = await checkPermission('invoices', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createClient();
  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const clientId = url.searchParams.get('client_id');
  const proposalId = url.searchParams.get('proposal_id');

  let query = supabase
    .from('invoices')
    .select('*, clients(company_name), invoice_line_items(*)')
    .eq('organization_id', perm.organizationId)
    .order('issue_date', { ascending: false });

  if (status) query = query.eq('status', status);
  if (clientId) query = query.eq('client_id', clientId);
  if (proposalId) query = query.eq('proposal_id', proposalId);

  const { data: invoices, error } = await query;
  if (error) return NextResponse.json({ error: 'Failed to fetch invoices', details: error.message }, { status: 500 });

  return NextResponse.json({ invoices: invoices ?? [] });
}

export async function POST(request: Request) {
  const perm = await checkPermission('invoices', 'create');
  if (!perm) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!perm.allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const {
    client_id,
    proposal_id,
    type,
    due_date,
    memo,
    line_items,
    status: statusOverride,
  } = body as {
    client_id?: string;
    proposal_id?: string;
    type?: string;
    due_date?: string;
    memo?: string;
    line_items?: Array<{ description: string; quantity: number; rate: number; tax_rate?: number }>;
    status?: string;
  };

  if (!client_id) {
    return NextResponse.json(
      { error: 'client_id is required.' },
      { status: 400 },
    );
  }

  if (!type) {
    return NextResponse.json(
      { error: 'type is required.' },
      { status: 400 },
    );
  }

  if (!due_date) {
    return NextResponse.json(
      { error: 'due_date is required.' },
      { status: 400 },
    );
  }

  if (!line_items || line_items.length === 0) {
    return NextResponse.json(
      { error: 'At least one line item is required.' },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const orgId = perm.organizationId;

  // Generate sequential invoice number: INV-{YYYY}-{sequential}
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;

  const { data: maxInvoice } = await supabase
    .from('invoices')
    .select('invoice_number')
    .eq('organization_id', orgId)
    .like('invoice_number', `${prefix}%`)
    .order('invoice_number', { ascending: false })
    .limit(1)
    .single();

  let nextSeq = 1;
  if (maxInvoice?.invoice_number) {
    const numPart = maxInvoice.invoice_number.replace(prefix, '');
    const parsed = parseInt(numPart, 10);
    if (!isNaN(parsed)) {
      nextSeq = parsed + 1;
    }
  }

  const invoiceNumber = `${prefix}${String(nextSeq).padStart(3, '0')}`;

  // Fetch org default tax rate for fallback
  const { data: orgData } = await supabase
    .from('organizations')
    .select('default_tax_rate')
    .eq('id', orgId)
    .single();
  const defaultTaxRate = (orgData?.default_tax_rate as number) ?? 0;

  // Calculate totals from line items with per-item tax
  const computedItems = line_items.map((li) => {
    const lineAmount = li.quantity * li.rate;
    const taxRate = li.tax_rate ?? defaultTaxRate;
    const lineTax = Math.round(lineAmount * (taxRate / 100) * 100) / 100;
    return { ...li, lineAmount, taxRate, lineTax };
  });

  const subtotal = computedItems.reduce((sum, li) => sum + li.lineAmount, 0);
  const taxAmount = computedItems.reduce((sum, li) => sum + li.lineTax, 0);
  const total = subtotal + taxAmount;

  const invoiceStatus =
    statusOverride === 'draft' ? 'draft' : 'draft';
  const issueDate = new Date().toISOString().split('T')[0];

  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert({
      organization_id: orgId,
      client_id,
      proposal_id: proposal_id || null,
      invoice_number: invoiceNumber,
      type,
      status: invoiceStatus,
      issue_date: issueDate,
      due_date,
      subtotal,
      tax_amount: taxAmount,
      total,
      amount_paid: 0,
      currency: 'USD',
      memo: memo || null,
    })
    .select()
    .single();

  if (invoiceError || !invoice) {
    return NextResponse.json(
      { error: 'Failed to create invoice.', details: invoiceError?.message },
      { status: 500 },
    );
  }

  // Insert line items into invoice_line_items table
  const lineItemRows = computedItems.map((li) => ({
    invoice_id: invoice.id,
    description: li.description,
    quantity: li.quantity,
    rate: li.rate,
    amount: li.lineAmount,
    is_taxable: li.taxRate > 0,
    tax_rate: li.taxRate,
    tax_amount: li.lineTax,
  }));

  const { error: lineItemError } = await supabase
    .from('invoice_line_items')
    .insert(lineItemRows);

  if (lineItemError) {
    return NextResponse.json(
      {
        error: 'Invoice created but line items failed.',
        details: lineItemError.message,
        invoice,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, invoice });
}
