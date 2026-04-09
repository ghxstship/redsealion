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
  const now = new Date().toISOString();

  // Fetch schedules due for generation
  const { data: schedules, error } = await supabase
    .from('recurring_invoice_schedules')
    .select('*, invoices!recurring_invoice_schedules_base_invoice_id_fkey(*, invoice_line_items(*))')
    .eq('is_active', true)
    .lte('next_run_date', now);

  if (error || !schedules) {
    log.error('Failed to fetch schedules', {}, error);
    return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 });
  }

  let generated = 0;
  const errors: string[] = [];

  for (const schedule of schedules) {
    try {
      const baseInvoice = schedule.invoices as Record<string, unknown> | null;
      if (!baseInvoice) continue;

      // Create new invoice from template
      const { error: insertErr } = await supabase
        .from('invoices')
        .insert({
          organization_id: baseInvoice.organization_id,
          client_id: baseInvoice.client_id,
          proposal_id: baseInvoice.proposal_id,
          invoice_number: `REC-${Date.now()}`,
          status: 'draft',
          issue_date: new Date().toISOString().split('T')[0],
          due_date: new Date(
            Date.now() + (Number(baseInvoice.payment_terms_days) || 30) * 86400000,
          ).toISOString().split('T')[0],
          subtotal: baseInvoice.subtotal,
          tax_amount: baseInvoice.tax_amount,
          total: baseInvoice.total,
          currency: baseInvoice.currency,
          notes: baseInvoice.notes,
        });

      if (insertErr) {
        errors.push(`Schedule ${schedule.id}: ${insertErr.message}`);
        continue;
      }

      // Advance next_run_date
      const freq = schedule.frequency as string;
      const nextDate = new Date(schedule.next_run_date);
      if (freq === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
      else if (freq === 'biweekly') nextDate.setDate(nextDate.getDate() + 14);
      else if (freq === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
      else if (freq === 'quarterly') nextDate.setMonth(nextDate.getMonth() + 3);
      else nextDate.setFullYear(nextDate.getFullYear() + 1);

      await supabase
        .from('recurring_invoice_schedules')
        .update({ next_run_date: nextDate.toISOString(), last_run_date: now })
        .eq('id', schedule.id);

      generated++;
    } catch (err) {
      errors.push(`Schedule ${schedule.id}: ${String(err)}`);
    }
  }

  log.info('Recurring invoices generated', { generated, errors: errors.length });
  return NextResponse.json({ generated, errors });
}
