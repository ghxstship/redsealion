import { NextRequest, NextResponse } from 'next/server';
import { requireCronAuth } from '@/lib/api/cron-guard';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * POST /api/cron/advance-expiry
 *
 * Runs daily. Transitions advances past their `expires_at` to 'expired' status.
 *
 * Gap: M-09 — The advance_status enum includes 'expired' and the schema has
 * `expires_at`, but no process automatically transitioned past-due advances.
 *
 * Also processes M-05: webhook events that were queued but never consumed.
 *
 * Vercel Cron config:
 *   { "path": "/api/cron/advance-expiry", "schedule": "0 2 * * *" }
 */

export async function POST(request: NextRequest) {
  const denied = requireCronAuth(request);
  if (denied) return denied;

  const supabase = await createServiceClient();
  const results: Record<string, unknown> = {};

  // ─── M-09: Expire past-due advances ───
  const { data: expired, error: expErr } = await supabase
    .from('production_advances')
    .update({ status: 'expired', updated_at: new Date().toISOString() })
    .lt('expires_at', new Date().toISOString())
    .in('status', ['draft', 'open_for_submissions'])
    .select('id');

  results.expired_count = expired?.length ?? 0;
  if (expErr) results.expire_error = expErr.message;

  // ─── M-05: Process queued webhook events ───
  const { data: events } = await supabase
    .from('advance_webhook_events')
    .select('*')
    .eq('processed', false)
    .order('created_at', { ascending: true })
    .limit(100);

  let processed = 0;
  if (events && events.length > 0) {
    for (const event of events as Array<Record<string, unknown>>) {
      try {
        // Get org webhook config
        const { data: config } = await supabase
          .from('webhook_endpoints')
          .select('url, secret, is_active')
          .eq('organization_id', event.organization_id)
          .eq('is_active', true);

        if (config && config.length > 0) {
          for (const endpoint of config as Array<Record<string, unknown>>) {
            await fetch(endpoint.url as string, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                event_type: event.event_type,
                payload: event.payload,
                timestamp: event.created_at,
              }),
            }).catch(() => {}); // Best-effort delivery
          }
        }

        await supabase
          .from('advance_webhook_events')
          .update({ processed: true, processed_at: new Date().toISOString() })
          .eq('id', event.id);

        processed++;
      } catch {
        // Continue processing remaining events
      }
    }
  }

  results.webhooks_processed = processed;
  results.webhooks_queued = (events?.length ?? 0) - processed;

  return NextResponse.json({ success: true, results });
}
