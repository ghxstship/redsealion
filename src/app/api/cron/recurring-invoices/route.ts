import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logger';

const log = createLogger('cron:recurring-invoices');

/**
 * POST /api/cron/recurring-invoices
 * Generates invoices from recurring_invoice_schedules that are due.
 * Expected to be called by Vercel Cron or external scheduler.
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createServiceClient();
  const today = new Date().toISOString().split('T')[0];

  // Fetch schedules due for generation — using actual schema columns
  const { data: schedules, error } = await supabase
    .from('recurring_invoice_schedules')
    .select('*, clients(company_name)')
    .eq('is_active', true)
    .lte('next_issue_date', today);

  if (error || !schedules) {
    log.error('Failed to fetch schedules', {}, error);
    return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 });
  }

  let generated = 0;
  const errors: string[] = [];

  for (const schedule of schedules) {
    try {
      const templateData = (schedule.template_data ?? {}) as Record<string, unknown>;
      const clientId = schedule.client_id as string;
      const orgId = schedule.organization_id as string;

      // Generate invoice number
      const invoiceNumber = `REC-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`;

      // Calculate due date (default 30 days)
      const dueDays = (templateData.payment_terms_days as number) || 30;
      const dueDate = new Date(Date.now() + dueDays * 86400000).toISOString().split('T')[0];

      // Use template data for amounts or fall back to schedule base_amount
      const subtotal = (templateData.subtotal as number) ?? (schedule.base_amount as number) ?? 0;
      const taxAmount = (templateData.tax_amount as number) ?? 0;
      const total = subtotal + taxAmount;

      const { data: newInvoice, error: insertErr } = await supabase
        .from('invoices')
        .insert({
          organization_id: orgId,
          client_id: clientId,
          proposal_id: (templateData.proposal_id as string) || null,
          invoice_number: invoiceNumber,
          type: (templateData.type as string) || 'recurring',
          status: 'draft',
          issue_date: today,
          due_date: dueDate,
          subtotal,
          tax_amount: taxAmount,
          total,
          amount_paid: 0,
          currency: (templateData.currency as string) || 'USD',
          memo: (templateData.memo as string) || null,
        })
        .select()
        .single();

      if (insertErr || !newInvoice) {
        errors.push(`Schedule ${schedule.id}: ${insertErr?.message ?? 'Insert failed'}`);
        continue;
      }

      // Copy template line items if present
      const templateLineItems = templateData.line_items as Array<Record<string, unknown>> | undefined;
      if (templateLineItems && templateLineItems.length > 0) {
        await supabase.from('invoice_line_items').insert(
          templateLineItems.map((li) => ({
            invoice_id: newInvoice.id,
            description: li.description as string,
            quantity: (li.quantity as number) ?? 1,
            rate: (li.rate as number) ?? 0,
            amount: ((li.quantity as number) ?? 1) * ((li.rate as number) ?? 0),
            tax_rate: (li.tax_rate as number) ?? 0,
            tax_amount: (li.tax_amount as number) ?? 0,
          })),
        );
      }

      // Advance next_issue_date using actual schema column names
      const freq = schedule.frequency as string;
      const nextDate = new Date(schedule.next_issue_date);
      if (freq === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
      else if (freq === 'biweekly') nextDate.setDate(nextDate.getDate() + 14);
      else if (freq === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
      else if (freq === 'quarterly') nextDate.setMonth(nextDate.getMonth() + 3);
      else nextDate.setFullYear(nextDate.getFullYear() + 1);

      // Check if schedule should be deactivated
      const endDate = schedule.end_date as string | null;
      const shouldDeactivate = endDate && new Date(nextDate) > new Date(endDate);

      await supabase
        .from('recurring_invoice_schedules')
        .update({
          next_issue_date: nextDate.toISOString().split('T')[0],
          last_generated_at: new Date().toISOString(),
          is_active: !shouldDeactivate,
        })
        .eq('id', schedule.id);

      generated++;
    } catch (err) {
      errors.push(`Schedule ${schedule.id}: ${String(err)}`);
    }
  }

  log.info('Recurring invoices generated', { generated, errors: errors.length });
  return NextResponse.json({ generated, errors });
}
