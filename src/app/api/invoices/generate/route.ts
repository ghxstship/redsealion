import { NextResponse } from 'next/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const perm = await checkPermission('invoices', 'create');
  if (!perm) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!perm.allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const { proposal_id } = body as { proposal_id?: string };

  if (!proposal_id) {
    return NextResponse.json(
      { success: false, error: 'proposal_id is required.' },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const orgId = perm.organizationId;

  // Fetch proposal with payment terms
  const { data: proposal, error: proposalError } = await supabase
    .from('proposals')
    .select()
    .eq('id', proposal_id)
    .eq('organization_id', orgId)
    .single();

  if (proposalError || !proposal) {
    return NextResponse.json(
      { success: false, error: 'Proposal not found.' },
      { status: 404 },
    );
  }

  // Fetch phases with deliverables and addons
  const { data: phases } = await supabase
    .from('phases')
    .select()
    .eq('proposal_id', proposal_id)
    .order('sort_order');

  const phaseIds = (phases ?? []).map((p: Record<string, unknown>) => p.id as string);

  let deliverables: Record<string, unknown>[] = [];
  let addons: Record<string, unknown>[] = [];

  if (phaseIds.length > 0) {
    const { data: delivData } = await supabase
      .from('phase_deliverables')
      .select()
      .in('phase_id', phaseIds)
      .order('sort_order');
    deliverables = delivData ?? [];

    const { data: addonData } = await supabase
      .from('phase_addons')
      .select()
      .in('phase_id', phaseIds)
      .eq('selected', true)
      .order('sort_order');
    addons = addonData ?? [];
  }

  // Determine payment terms (from proposal or defaults)
  const paymentTerms = proposal.payment_terms as {
    structure?: string;
    depositPercent?: number;
    balancePercent?: number;
  } | null;

  const depositPercent = paymentTerms?.depositPercent ?? 50;
  const balancePercent = paymentTerms?.balancePercent ?? 50;

  // Build line items from deliverables and selected addons
  const allLineItems: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
    phase_number: string | null;
    category: string | null;
    deliverable_id: string | null;
    addon_id: string | null;
  }> = [];

  // Map phase_id to phase number for labeling
  const phaseMap = new Map<string, string>();
  for (const p of phases ?? []) {
    phaseMap.set(p.id as string, p.number as string);
  }

  for (const d of deliverables) {
    allLineItems.push({
      description: d.name as string,
      quantity: d.qty as number,
      rate: d.unit_cost as number,
      amount: d.total_cost as number,
      phase_number: phaseMap.get(d.phase_id as string) ?? null,
      category: (d.category as string) ?? null,
      deliverable_id: d.id as string,
      addon_id: null,
    });
  }

  for (const a of addons) {
    allLineItems.push({
      description: a.name as string,
      quantity: a.qty as number,
      rate: a.unit_cost as number,
      amount: a.total_cost as number,
      phase_number: phaseMap.get(a.phase_id as string) ?? null,
      category: (a.category as string) ?? null,
      deliverable_id: null,
      addon_id: a.id as string,
    });
  }

  const totalValue = allLineItems.reduce((sum, li) => sum + li.amount, 0);

  // Generate invoice number prefix
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
    const numPart = (maxInvoice.invoice_number as string).replace(prefix, '');
    const parsed = parseInt(numPart, 10);
    if (!isNaN(parsed)) {
      nextSeq = parsed + 1;
    }
  }

  const issueDate = new Date().toISOString().split('T')[0];
  const createdInvoices: Record<string, unknown>[] = [];

  // Create deposit invoice
  if (depositPercent > 0) {
    const depositTotal = Math.round((totalValue * depositPercent) / 100 * 100) / 100;
    const invoiceNumber = `${prefix}${String(nextSeq).padStart(3, '0')}`;
    nextSeq++;

    const depositDue = new Date(Date.now() + 14 * 86400000)
      .toISOString()
      .split('T')[0];

    const { data: depositInvoice, error: depErr } = await supabase
      .from('invoices')
      .insert({
        organization_id: orgId,
        client_id: proposal.client_id,
        proposal_id,
        invoice_number: invoiceNumber,
        type: 'deposit',
        status: 'draft',
        issue_date: issueDate,
        due_date: depositDue,
        subtotal: depositTotal,
        tax_amount: 0,
        total: depositTotal,
        amount_paid: 0,
        currency: (proposal.currency as string) ?? 'USD',
        memo: `Deposit (${depositPercent}%) for ${proposal.name}`,
      })
      .select()
      .single();

    if (!depErr && depositInvoice) {
      // Insert a single summary line item for deposit
      await supabase.from('invoice_line_items').insert({
        invoice_id: depositInvoice.id,
        description: `Deposit (${depositPercent}%) - ${proposal.name}`,
        quantity: 1,
        rate: depositTotal,
        amount: depositTotal,
        taxable: false,
      });
      createdInvoices.push(depositInvoice);
    }
  }

  // Create balance invoice with detailed line items
  if (balancePercent > 0) {
    const balanceTotal = Math.round((totalValue * balancePercent) / 100 * 100) / 100;
    const invoiceNumber = `${prefix}${String(nextSeq).padStart(3, '0')}`;

    const balanceDue = new Date(Date.now() + 90 * 86400000)
      .toISOString()
      .split('T')[0];

    const { data: balanceInvoice, error: balErr } = await supabase
      .from('invoices')
      .insert({
        organization_id: orgId,
        client_id: proposal.client_id,
        proposal_id,
        invoice_number: invoiceNumber,
        type: 'balance',
        status: 'draft',
        issue_date: issueDate,
        due_date: balanceDue,
        subtotal: balanceTotal,
        tax_amount: 0,
        total: balanceTotal,
        amount_paid: 0,
        currency: (proposal.currency as string) ?? 'USD',
        memo: `Balance (${balancePercent}%) for ${proposal.name}`,
      })
      .select()
      .single();

    if (!balErr && balanceInvoice) {
      // Insert detailed line items scaled to balance percent
      const scaledItems = allLineItems.map((li) => ({
        invoice_id: balanceInvoice.id,
        description: li.description,
        quantity: li.quantity,
        rate: Math.round((li.rate * balancePercent) / 100 * 100) / 100,
        amount: Math.round((li.amount * balancePercent) / 100 * 100) / 100,
        taxable: false,
        phase_number: li.phase_number,
        category: li.category,
        deliverable_id: li.deliverable_id,
        addon_id: li.addon_id,
      }));

      if (scaledItems.length > 0) {
        await supabase.from('invoice_line_items').insert(scaledItems);
      }
      createdInvoices.push(balanceInvoice);
    }
  }

  return NextResponse.json({
    success: true,
    proposal_id,
    invoices: createdInvoices,
    message: `Generated ${createdInvoices.length} draft invoice(s) from proposal.`,
  });
}
