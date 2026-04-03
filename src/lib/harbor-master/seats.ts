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
