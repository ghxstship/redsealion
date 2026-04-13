import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/cron/compliance-renewal
 *
 * Cron endpoint for compliance document renewal reminders.
 * Designed to be called by Vercel Cron or Supabase Edge Functions
 * on a daily schedule.
 *
 * Behavior:
 * 1. Queries v_compliance_expiring_soon (documents expiring in 30 days)
 * 2. Marks documents as reminder_sent to prevent duplicate notifications
 * 3. Returns a summary of processed documents for logging
 *
 * Note: Actual email/notification delivery should be handled by a
 * notification service (e.g. Resend, Supabase edge function webhook).
 * This endpoint focuses on state management and data collection.
 */

// Verify cron secret to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(request: Request) {
  // Auth: verify cron secret header
  const authHeader = request.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = await createClient();

    // 1. Fetch all documents expiring within 30 days that haven't been notified
    const { data: expiringDocs, error: fetchError } = await supabase
      .from('compliance_documents')
      .select('id, entity_id, entity_type, doc_type, file_name, expiry_date, organization_id, auto_renew')
      .is('deleted_at', null)
      .eq('renewal_reminder_sent', false)
      .not('expiry_date', 'is', null)
      .lte('expiry_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())
      .gte('expiry_date', new Date().toISOString());

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    const docs = expiringDocs ?? [];

    if (docs.length === 0) {
      return NextResponse.json({ processed: 0, message: 'No expiring documents found' });
    }

    // 2. Group by organization for batch processing
    const byOrg = new Map<string, typeof docs>();
    for (const doc of docs) {
      const orgId = doc.organization_id;
      if (!byOrg.has(orgId)) byOrg.set(orgId, []);
      byOrg.get(orgId)!.push(doc);
    }

    // 3. Process each organization's expiring documents
    const notificationPayloads: Array<{
      organization_id: string;
      documents: Array<{
        id: string;
        doc_type: string;
        file_name: string;
        expiry_date: string;
        days_until_expiry: number;
        auto_renew: boolean;
      }>;
    }> = [];

    for (const [orgId, orgDocs] of byOrg) {
      const docSummaries = orgDocs.map((doc) => ({
        id: doc.id,
        doc_type: doc.doc_type ?? 'unknown',
        file_name: doc.file_name ?? 'Unnamed',
        expiry_date: doc.expiry_date!,
        days_until_expiry: Math.ceil(
          (new Date(doc.expiry_date!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        ),
        auto_renew: doc.auto_renew ?? false,
      }));

      notificationPayloads.push({
        organization_id: orgId,
        documents: docSummaries,
      });
    }

    // 4. Mark all processed docs as reminder sent
    const docIds = docs.map((d) => d.id);
    const { error: updateError } = await supabase
      .from('compliance_documents')
      .update({ renewal_reminder_sent: true })
      .in('id', docIds);

    if (updateError) {
      console.error('Failed to mark reminders as sent:', updateError);
    }

    // 5. TODO: Send actual notifications via webhook/email service
    // This is where you'd call Resend, SendGrid, or trigger a Supabase
    // Edge Function to send expiry reminder emails.
    // For now, we return the payloads for logging/debugging.

    return NextResponse.json({
      processed: docs.length,
      organizations: notificationPayloads.length,
      payloads: notificationPayloads,
    });
  } catch (err) {
    console.error('Compliance renewal cron failed:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
