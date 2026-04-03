/**
 * Harbor Master — Seat Management
 *
 * Enforces seat limits before membership creation (§8).
 */
import { createClient } from '@/lib/supabase/server';
import type { SeatType } from '@/types/harbor-master';

export interface SeatCheckResult {
  allowed: boolean;
  reason?: string;
  overageTriggered?: boolean;
  available: number;
}

/**
 * Check if a seat is available for the given organization and seat type.
 * Must be called before ANY membership creation (Flows A–G).
 */
export async function checkSeatAvailability(
  organizationId: string,
  seatType: SeatType,
): Promise<SeatCheckResult> {
  const supabase = await createClient();

  const { data: allocation } = await supabase
    .from('seat_allocations')
    .select('*')
    .eq('organization_id', organizationId)
    .single();

  if (!allocation) {
    return { allowed: true, available: 999 }; // No allocation = unlimited (free tier fallback)
  }

  const isInternal = seatType === 'internal';
  const included = isInternal
    ? (allocation.internal_seats_included as number)
    : (allocation.external_seats_included as number);
  const purchased = isInternal
    ? (allocation.internal_seats_purchased as number)
    : (allocation.external_seats_purchased as number);
  const used = isInternal
    ? (allocation.internal_seats_used as number)
    : (allocation.external_seats_used as number);

  const available = (included + purchased) - used;

  if (available > 0) {
    return { allowed: true, available };
  }

  if (allocation.overage_allowed) {
    return { allowed: true, available: 0, overageTriggered: true };
  }

  return {
    allowed: false,
    available: 0,
    reason: `No ${seatType} seats available. ${used} of ${included + purchased} seats in use.`,
  };
}

/**
 * Increment seat usage after membership creation.
 */
export async function incrementSeatUsage(
  organizationId: string,
  seatType: SeatType,
): Promise<void> {
  const supabase = await createClient();
  const field = seatType === 'internal' ? 'internal_seats_used' : 'external_seats_used';

  const { data: allocation } = await supabase
    .from('seat_allocations')
    .select(field)
    .eq('organization_id', organizationId)
    .single();

  if (allocation) {
    await supabase
      .from('seat_allocations')
      .update({ [field]: (allocation[field] as number) + 1 })
      .eq('organization_id', organizationId);
  }
}

/**
 * Decrement seat usage after membership removal.
 */
export async function decrementSeatUsage(
  organizationId: string,
  seatType: SeatType,
): Promise<void> {
  const supabase = await createClient();
  const field = seatType === 'internal' ? 'internal_seats_used' : 'external_seats_used';

  const { data: allocation } = await supabase
    .from('seat_allocations')
    .select(field)
    .eq('organization_id', organizationId)
    .single();

  if (allocation) {
    const currentValue = allocation[field] as number;
    await supabase
      .from('seat_allocations')
      .update({ [field]: Math.max(0, currentValue - 1) })
      .eq('organization_id', organizationId);
  }
}

/**
 * Reconcile seat counts by counting actual active memberships.
 * Run as a daily cron job to correct drift between seat_allocations
 * counters and actual membership rows.
 */
export async function reconcileSeats(organizationId: string): Promise<{
  internalBefore: number;
  internalAfter: number;
  externalBefore: number;
  externalAfter: number;
}> {
  const supabase = await createClient();

  const { data: allocation } = await supabase
    .from('seat_allocations')
    .select('internal_seats_used, external_seats_used')
    .eq('organization_id', organizationId)
    .single();

  if (!allocation) {
    return { internalBefore: 0, internalAfter: 0, externalBefore: 0, externalAfter: 0 };
  }

  const internalBefore = allocation.internal_seats_used as number;
  const externalBefore = allocation.external_seats_used as number;

  // Count actual active memberships
  const { count: internalCount } = await supabase
    .from('organization_memberships')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .eq('seat_type', 'internal');

  const { count: externalCount } = await supabase
    .from('organization_memberships')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .eq('seat_type', 'external');

  const internalAfter = internalCount ?? 0;
  const externalAfter = externalCount ?? 0;

  // Update if drifted
  if (internalAfter !== internalBefore || externalAfter !== externalBefore) {
    await supabase
      .from('seat_allocations')
      .update({
        internal_seats_used: internalAfter,
        external_seats_used: externalAfter,
        last_reconciled_at: new Date().toISOString(),
      })
      .eq('organization_id', organizationId);
  }

  return { internalBefore, internalAfter, externalBefore, externalAfter };
}
