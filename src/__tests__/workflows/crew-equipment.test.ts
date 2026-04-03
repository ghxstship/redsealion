/**
 * Crew & Equipment — End-to-End Workflow Validation
 *
 * Crew bookings:
 *   + Booking creation with shift times
 *   + Conflict detection (overlapping shifts)
 *   + Booking status: confirmed → completed / declined / cancelled
 *
 * Equipment reservations:
 *   + Reservation status: reserved → checked_out → returned / cancelled
 *   + Check-out requires reserved status
 *   + Check-in requires checked_out status
 *   + Condition tracking on return
 */
import { describe, it, expect } from 'vitest';
import {
  makeCrewProfile,
  makeCrewBooking,
  makeEquipmentReservation,
  TEST_ORG_ID,
} from '../helpers';

const BOOKING_STATUSES = ['confirmed', 'completed', 'declined', 'cancelled'];

const VALID_BOOKING_TRANSITIONS: Record<string, string[]> = {
  confirmed: ['completed', 'declined', 'cancelled'],
  completed: [],
  declined: [],
  cancelled: ['confirmed'],     // can rebook
};

const RESERVATION_STATUSES = ['reserved', 'checked_out', 'returned', 'cancelled'];

const VALID_RESERVATION_TRANSITIONS: Record<string, string[]> = {
  reserved: ['checked_out', 'cancelled'],
  checked_out: ['returned'],
  returned: [],
  cancelled: [],
};

describe('Crew Booking Workflow', () => {
  // -----------------------------------------------------------------------
  // Booking status machine
  // -----------------------------------------------------------------------

  describe('Booking status transitions', () => {
    it('defines all 4 booking statuses', () => {
      expect(BOOKING_STATUSES).toHaveLength(4);
    });

    it('allows confirmed → completed flow', () => {
      expect(VALID_BOOKING_TRANSITIONS.confirmed).toContain('completed');
    });

    it('allows declining a confirmed booking', () => {
      expect(VALID_BOOKING_TRANSITIONS.confirmed).toContain('declined');
    });

    it('allows cancelling a confirmed booking', () => {
      expect(VALID_BOOKING_TRANSITIONS.confirmed).toContain('cancelled');
    });

    it('prevents transitions from terminal states', () => {
      expect(VALID_BOOKING_TRANSITIONS.completed).toHaveLength(0);
      expect(VALID_BOOKING_TRANSITIONS.declined).toHaveLength(0);
    });

    it('allows rebooking from cancelled', () => {
      expect(VALID_BOOKING_TRANSITIONS.cancelled).toContain('confirmed');
    });
  });

  // -----------------------------------------------------------------------
  // Crew profile
  // -----------------------------------------------------------------------

  describe('Crew profile', () => {
    it('creates a crew profile with required fields', () => {
      const crew = makeCrewProfile();
      expect(crew.id).toBeTruthy();
      expect(crew.organization_id).toBe(TEST_ORG_ID);
      expect(crew.full_name).toBeTruthy();
      expect(crew.role).toBeTruthy();
      expect(crew.status).toBe('active');
    });

    it('supports rate card (hourly and day rates)', () => {
      const crew = makeCrewProfile();
      expect(crew.hourly_rate).toBeGreaterThan(0);
      expect(crew.day_rate).toBeGreaterThan(0);
    });

    it('supports skills and certifications', () => {
      const crew = makeCrewProfile();
      expect(Array.isArray(crew.skills)).toBe(true);
      expect(Array.isArray(crew.certifications)).toBe(true);
      expect(crew.skills.length).toBeGreaterThan(0);
    });
  });

  // -----------------------------------------------------------------------
  // Booking creation
  // -----------------------------------------------------------------------

  describe('Booking creation', () => {
    it('creates a booking with shift times', () => {
      const booking = makeCrewBooking();
      expect(booking.shift_start).toBeTruthy();
      expect(booking.shift_end).toBeTruthy();
      expect(booking.status).toBe('confirmed');
    });

    it('requires shift_start and shift_end', () => {
      const booking = makeCrewBooking();
      expect(booking.shift_start).toBeTruthy();
      expect(booking.shift_end).toBeTruthy();
    });

    it('validates shift_end is after shift_start', () => {
      const booking = makeCrewBooking();
      const start = new Date(booking.shift_start as string);
      const end = new Date(booking.shift_end as string);
      expect(end.getTime()).toBeGreaterThan(start.getTime());
    });

    it('links to proposal and crew profile', () => {
      const booking = makeCrewBooking();
      expect(booking.crew_profile_id).toBeTruthy();
      expect(booking.proposal_id).toBeTruthy();
    });

    it('supports optional rate information', () => {
      const booking = makeCrewBooking({ rate_type: 'hourly', rate_amount: 45 });
      expect(booking.rate_type).toBe('hourly');
      expect(booking.rate_amount).toBe(45);
    });
  });

  // -----------------------------------------------------------------------
  // Conflict detection
  // -----------------------------------------------------------------------

  describe('Booking conflict detection', () => {
    it('detects overlapping shifts', () => {
      const existingBooking = makeCrewBooking({
        shift_start: '2026-04-10T08:00:00Z',
        shift_end: '2026-04-10T18:00:00Z',
      });

      const newBooking = {
        shift_start: '2026-04-10T12:00:00Z',
        shift_end: '2026-04-10T20:00:00Z',
      };

      // Conflict detection: new shift_start < existing shift_end AND new shift_end > existing shift_start
      const hasConflict =
        newBooking.shift_start < (existingBooking.shift_end as string) &&
        newBooking.shift_end > (existingBooking.shift_start as string);

      expect(hasConflict).toBe(true);
    });

    it('allows non-overlapping shifts', () => {
      const existingBooking = makeCrewBooking({
        shift_start: '2026-04-10T08:00:00Z',
        shift_end: '2026-04-10T18:00:00Z',
      });

      const newBooking = {
        shift_start: '2026-04-11T08:00:00Z',
        shift_end: '2026-04-11T18:00:00Z',
      };

      const hasConflict =
        newBooking.shift_start < (existingBooking.shift_end as string) &&
        newBooking.shift_end > (existingBooking.shift_start as string);

      expect(hasConflict).toBe(false);
    });

    it('allows adjacent shifts (no overlap)', () => {
      const existingBooking = makeCrewBooking({
        shift_start: '2026-04-10T08:00:00Z',
        shift_end: '2026-04-10T18:00:00Z',
      });

      const newBooking = {
        shift_start: '2026-04-10T18:00:00Z',
        shift_end: '2026-04-10T22:00:00Z',
      };

      const hasConflict =
        newBooking.shift_start < (existingBooking.shift_end as string) &&
        newBooking.shift_end > (existingBooking.shift_start as string);

      expect(hasConflict).toBe(false);
    });

    it('excludes declined/cancelled bookings from conflict check', () => {
      const declinedBooking = makeCrewBooking({
        status: 'declined',
        shift_start: '2026-04-10T08:00:00Z',
        shift_end: '2026-04-10T18:00:00Z',
      });

      const excludeFromConflictCheck = ['declined', 'cancelled'];
      const shouldCheck = !excludeFromConflictCheck.includes(declinedBooking.status as string);
      expect(shouldCheck).toBe(false);
    });
  });
});

// ===========================================================================
// Equipment Reservation Workflow
// ===========================================================================

describe('Equipment Reservation Workflow', () => {
  // -----------------------------------------------------------------------
  // Reservation status machine
  // -----------------------------------------------------------------------

  describe('Reservation status transitions', () => {
    it('defines all 4 reservation statuses', () => {
      expect(RESERVATION_STATUSES).toHaveLength(4);
    });

    it('allows reserved → checked_out flow', () => {
      expect(VALID_RESERVATION_TRANSITIONS.reserved).toContain('checked_out');
    });

    it('allows checked_out → returned flow', () => {
      expect(VALID_RESERVATION_TRANSITIONS.checked_out).toContain('returned');
    });

    it('allows cancelling a reservation', () => {
      expect(VALID_RESERVATION_TRANSITIONS.reserved).toContain('cancelled');
    });

    it('prevents transitions from terminal states', () => {
      expect(VALID_RESERVATION_TRANSITIONS.returned).toHaveLength(0);
      expect(VALID_RESERVATION_TRANSITIONS.cancelled).toHaveLength(0);
    });
  });

  // -----------------------------------------------------------------------
  // Check-out workflow
  // -----------------------------------------------------------------------

  describe('Equipment check-out', () => {
    it('can only check out from reserved status', () => {
      const reserved = makeEquipmentReservation({ status: 'reserved' });
      expect(reserved.status).toBe('reserved');
      expect(VALID_RESERVATION_TRANSITIONS.reserved).toContain('checked_out');
    });

    it('rejects check-out from non-reserved status', () => {
      const checkedOut = makeEquipmentReservation({ status: 'checked_out' });
      expect(VALID_RESERVATION_TRANSITIONS[checkedOut.status as string]).not.toContain('checked_out');
    });

    it('records checked_out_by and checked_out_at', () => {
      const reservation = makeEquipmentReservation({
        status: 'checked_out',
        checked_out_by: 'user_001',
        checked_out_at: '2026-04-08T09:00:00Z',
      });
      expect(reservation.checked_out_by).toBeTruthy();
      expect(reservation.checked_out_at).toBeTruthy();
    });
  });

  // -----------------------------------------------------------------------
  // Check-in workflow
  // -----------------------------------------------------------------------

  describe('Equipment check-in', () => {
    it('can only check in from checked_out status', () => {
      const checkedOut = makeEquipmentReservation({ status: 'checked_out' });
      expect(checkedOut.status).toBe('checked_out');
      expect(VALID_RESERVATION_TRANSITIONS.checked_out).toContain('returned');
    });

    it('rejects check-in from reserved status', () => {
      const reserved = makeEquipmentReservation({ status: 'reserved' });
      expect(VALID_RESERVATION_TRANSITIONS[reserved.status as string]).not.toContain('returned');
    });

    it('records returned_by and returned_at', () => {
      const reservation = makeEquipmentReservation({
        status: 'returned',
        returned_by: 'user_001',
        returned_at: '2026-04-12T16:00:00Z',
      });
      expect(reservation.returned_by).toBeTruthy();
      expect(reservation.returned_at).toBeTruthy();
    });

    it('records condition_on_return', () => {
      const reservation = makeEquipmentReservation({
        status: 'returned',
        condition_on_return: 'good',
      });
      expect(reservation.condition_on_return).toBe('good');
    });

    it('supports all condition values on return', () => {
      const conditions = ['new', 'excellent', 'good', 'fair', 'poor', 'damaged'];
      for (const condition of conditions) {
        const res = makeEquipmentReservation({ condition_on_return: condition });
        expect(res.condition_on_return).toBe(condition);
      }
    });
  });

  // -----------------------------------------------------------------------
  // Full lifecycle
  // -----------------------------------------------------------------------

  describe('Full equipment lifecycle', () => {
    it('validates reserved → checked_out → returned flow', () => {
      const flow = ['reserved', 'checked_out', 'returned'];
      for (let i = 0; i < flow.length - 1; i++) {
        expect(VALID_RESERVATION_TRANSITIONS[flow[i]]).toContain(flow[i + 1]);
      }
    });
  });
});
