import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  // Ideally secured via cron secret in production
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET || 'dev-cron'}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];

  const { data: schedules, error: schedError } = await supabase
    .from('recurring_invoice_schedules')
    .select('*')
    .eq('is_active', true)
    .is('deleted_at', null)
    .lte('next_issue_date', today);

  if (schedError) {
    return NextResponse.json({ error: 'Failed to fetch schedules', details: schedError.message }, { status: 500 });
  }

  if (!schedules || schedules.length === 0) {
    return NextResponse.json({ success: true, processed: 0, message: 'No schedules to process today.' });
  }

  const results = [];
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;

  for (const schedule of schedules) {
    const orgId = schedule.organization_id;
    const clientId = schedule.client_id;
    const templateData = schedule.template_data as Record<string, any>;
    
    // Generate next invoice number
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

    const invoiceNumber = `${prefix}${String(nextSeq).padStart(3, '0')}`;
    const dueDateStr = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]; // Default +30 days

    const { data: invoice, error: invErr } = await supabase
      .from('invoices')
      .insert({
        organization_id: orgId,
        client_id: clientId,
        invoice_number: invoiceNumber,
        type: 'standard',
        status: 'draft',
        issue_date: today,
        due_date: dueDateStr,
        subtotal: templateData.subtotal || 0,
        tax_amount: templateData.tax_amount || 0,
        total: templateData.total || 0,
        amount_paid: 0,
        currency: templateData.currency || 'USD',
        memo: templateData.memo || `Recurring Invoice - ${today}`,
      })
      .select()
      .single();

    if (invErr) {
      results.push({ schedule_id: schedule.id, status: 'error', error: invErr.message });
      continue;
    }

    // Insert lines
    if (templateData.line_items && Array.isArray(templateData.line_items)) {
      const lines = templateData.line_items.map((li: any) => ({
        invoice_id: invoice.id,
        description: li.description,
        quantity: li.quantity || 1,
        rate: li.rate || 0,
        amount: li.amount || 0,
        taxable: li.taxable ?? true,
      }));
      await supabase.from('invoice_line_items').insert(lines);
    }

    // Fast-forward next issue date
    const d = new Date(schedule.next_issue_date);
    if (schedule.frequency === 'weekly') d.setDate(d.getDate() + 7);
    else if (schedule.frequency === 'monthly') d.setMonth(d.getMonth() + 1);
    else if (schedule.frequency === 'yearly') d.setFullYear(d.getFullYear() + 1);
    else d.setMonth(d.getMonth() + 1); // fallback to monthly

    let isActive = true;
    if (schedule.end_date && d.toISOString().split('T')[0] > schedule.end_date) {
      isActive = false;
    }

    await supabase
      .from('recurring_invoice_schedules')
      .update({
        next_issue_date: d.toISOString().split('T')[0],
        last_generated_at: new Date().toISOString(),
        is_active: isActive
      })
      .eq('id', schedule.id);

    results.push({ schedule_id: schedule.id, status: 'success', invoice_id: invoice.id });
  }

  return NextResponse.json({ success: true, processed: results.length, results });
}
