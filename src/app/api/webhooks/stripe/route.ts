/**
 * Stripe webhook handler.
 *
 * Closes closure ticket C-INT-04 — routes chargeback + refund events
 * into the role-lifecycle exception table so reconciliation reopens.
 *
 * Signature verification uses the STRIPE_WEBHOOK_SECRET environment
 * variable. Events we recognize:
 *   - charge.refunded           -> reopen reconciliation as 'chargeback'
 *   - charge.dispute.created    -> raise 'dispute' exception
 *   - charge.dispute.funds_withdrawn -> raise 'chargeback' exception
 *   - charge.dispute.closed     -> resolve the exception
 *
 * All unknown events are acknowledged (200) but ignored.
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { createClient } from '@/lib/supabase/server';

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? '';

/**
 * Verify a Stripe signature header of the form
 *   t=<timestamp>,v1=<signature>,v0=<legacy>
 * against the raw request body.
 */
function verifyStripeSignature(rawBody: string, header: string | null, secret: string): boolean {
  if (!header || !secret) return false;
  const parts = header.split(',').map(p => p.trim());
  const tsPart = parts.find(p => p.startsWith('t='))?.slice(2);
  const v1Part = parts.find(p => p.startsWith('v1='))?.slice(3);
  if (!tsPart || !v1Part) return false;

  const signedPayload = `${tsPart}.${rawBody}`;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(signedPayload, 'utf8')
    .digest('hex');

  if (expected.length !== v1Part.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1Part));
}

interface StripeEvent {
  id: string;
  type: string;
  data?: { object?: Record<string, unknown> };
}

interface StripeChargeObject {
  id?: string;
  metadata?: { project_id?: string; user_id?: string; organization_id?: string };
}

interface StripeDisputeObject {
  id?: string;
  charge?: string;
  reason?: string;
  metadata?: { project_id?: string; user_id?: string; organization_id?: string };
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (WEBHOOK_SECRET && !verifyStripeSignature(rawBody, signature, WEBHOOK_SECRET)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Malformed body' }, { status: 400 });
  }

  const supabase = await createClient();

  switch (event.type) {
    case 'charge.refunded': {
      const obj = event.data?.object as StripeChargeObject | undefined;
      await insertException(supabase, {
        kind: 'chargeback',
        organization_id: obj?.metadata?.organization_id,
        project_id: obj?.metadata?.project_id,
        subject_user_id: obj?.metadata?.user_id,
        payload: { event_id: event.id, charge_id: obj?.id, source: 'stripe:charge.refunded' },
      });
      break;
    }
    case 'charge.dispute.created': {
      const obj = event.data?.object as StripeDisputeObject | undefined;
      await insertException(supabase, {
        kind: 'dispute',
        organization_id: obj?.metadata?.organization_id,
        project_id: obj?.metadata?.project_id,
        subject_user_id: obj?.metadata?.user_id,
        payload: { event_id: event.id, dispute_id: obj?.id, charge_id: obj?.charge, reason: obj?.reason, source: 'stripe:charge.dispute.created' },
      });
      break;
    }
    case 'charge.dispute.funds_withdrawn': {
      const obj = event.data?.object as StripeDisputeObject | undefined;
      await insertException(supabase, {
        kind: 'chargeback',
        organization_id: obj?.metadata?.organization_id,
        project_id: obj?.metadata?.project_id,
        subject_user_id: obj?.metadata?.user_id,
        payload: { event_id: event.id, dispute_id: obj?.id, source: 'stripe:charge.dispute.funds_withdrawn' },
      });
      break;
    }
    case 'charge.dispute.closed': {
      const obj = event.data?.object as StripeDisputeObject | undefined;
      if (obj?.id) {
        await supabase
          .from('role_lifecycle_exceptions')
          .update({ resolved_at: new Date().toISOString(), resolution: `stripe:closed:${event.id}` })
          .contains('payload', { dispute_id: obj.id });
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true, id: event.id });
}

interface InsertExceptionArgs {
  kind: 'chargeback' | 'dispute';
  organization_id?: string;
  project_id?: string;
  subject_user_id?: string;
  payload: Record<string, unknown>;
}

async function insertException(
  supabase: Awaited<ReturnType<typeof createClient>>,
  args: InsertExceptionArgs,
): Promise<void> {
  if (!args.organization_id) return;
  await supabase.from('role_lifecycle_exceptions').insert({
    organization_id: args.organization_id,
    project_id: args.project_id ?? null,
    subject_user_id: args.subject_user_id ?? null,
    kind: args.kind,
    raised_by: args.subject_user_id ?? args.organization_id,
    payload: args.payload,
  });
}
