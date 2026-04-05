import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { notifyPaymentReminder } from '@/lib/notifications/triggers';
import { requireCronAuth } from '@/lib/api/cron-guard';

/**
 * Cron-compatible endpoint that sends payment reminders for overdue invoices.
 *
 * Designed to be called by Vercel Cron, external scheduler, or manual trigger.
 * Secured via CRON_SECRET env var — include as Authorization: Bearer <secret>.
 *
 * Cadence: daily at 9am UTC
 * Vercel cron config (vercel.json):
 *   { "crons": [{ "path": "/api/invoices/send-reminders", "schedule": "0 9 * * *" }] }
 */
export async function GET(request: Request) {
  // --- Verify CRON_SECRET (centralized SSOT guard) ---
  const denied = requireCronAuth(request);
  if (denied) return denied;

  try {
    const supabase = await createServiceClient();

    // Find all overdue unpaid/partially_paid invoices
    const today = new Date().toISOString().split('T')[0];

    const { data: overdueInvoices, error } = await supabase
      .from('invoices')
      .select('id, invoice_number, due_date')
      .lt('due_date', today)
      .in('status', ['sent', 'partially_paid'])
      .order('due_date', { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to query invoices', details: error.message },
        { status: 500 },
      );
    }

    const invoices = overdueInvoices ?? [];

    if (invoices.length === 0) {
      return NextResponse.json({
        message: 'No overdue invoices found',
        sent: 0,
      });
    }

    // Send reminders in parallel (fire-and-forget per invoice)
    const results = await Promise.allSettled(
      invoices.map((inv) => notifyPaymentReminder(inv.id)),
    );

    const sent = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    return NextResponse.json({
      message: `Processed ${invoices.length} overdue invoices`,
      sent,
      failed,
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
