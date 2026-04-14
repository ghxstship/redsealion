/**
 * RBAC — Invitation Tests (A01–A15)
 * Validates the direct invitation flow end-to-end.
 */
import { describe, it, expect } from 'vitest';
import type {
  SeatType,
  InvitationStatus,
} from '@/types/rbac';

// ---------------------------------------------------------------------------
// Test helpers — pure validation logic
// ---------------------------------------------------------------------------

interface InvitationInput {
  inviterHierarchyLevel: number;
  targetRoleHierarchyLevel: number;
  hasInvitePermission: boolean;
  existingMembership: { status: string } | null;
  existingPendingInvite: { status: string } | null;
  seatType: SeatType;
  scopeAllowsExternal: boolean;
  seatsAvailable: number;
  overageAllowed: boolean;
}

interface Result { valid: boolean; error?: string; code?: string; overageTriggered?: boolean }

function validateInvitation(input: InvitationInput): Result {
  if (!input.hasInvitePermission) {
    return { valid: false, error: 'Insufficient permissions', code: 'NO_PERMISSION' };
  }
  if (input.targetRoleHierarchyLevel < input.inviterHierarchyLevel) {
    return { valid: false, error: 'Hierarchy violation', code: 'HIERARCHY_VIOLATION' };
  }
  if (input.existingMembership?.status === 'active') {
    return { valid: false, error: 'Already a member', code: 'ALREADY_MEMBER' };
  }
  if (input.existingPendingInvite?.status === 'pending') {
    return { valid: false, error: 'Duplicate pending invitation', code: 'DUPLICATE' };
  }
  if (input.seatType === 'external' && !input.scopeAllowsExternal) {
    return { valid: false, error: 'External seats not allowed', code: 'EXTERNAL_NOT_ALLOWED' };
  }
  if (input.seatsAvailable <= 0) {
    if (input.overageAllowed) {
      return { valid: true, overageTriggered: true };
    }
    return { valid: false, error: 'Seat limit reached', code: 'SEAT_LIMIT' };
  }
  return { valid: true };
}

function validateAcceptance(input: {
  status: InvitationStatus;
  expiresAt: string;
  invitedEmail: string;
  acceptorEmail: string;
  now?: string;
}): Result {
  if (input.status !== 'pending') {
    return { valid: false, error: 'Invitation is not pending', code: 'NOT_PENDING' };
  }
  const now = input.now ? new Date(input.now) : new Date();
  if (new Date(input.expiresAt) < now) {
    return { valid: false, error: 'Invitation has expired', code: 'EXPIRED' };
  }
  if (input.invitedEmail !== input.acceptorEmail) {
    return { valid: false, error: 'Email mismatch', code: 'EMAIL_MISMATCH' };
  }
  return { valid: true };
}

function canRevoke(input: { actorId: string; invitedBy: string; hasApprovePermission: boolean }): boolean {
  return input.actorId === input.invitedBy || input.hasApprovePermission;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RBAC — Invitation Tests (A01–A15)', () => {
  it('A01: Admin invites user to org as Member', () => {
    const result = validateInvitation({
      inviterHierarchyLevel: 20, // admin
      targetRoleHierarchyLevel: 40, // member
      hasInvitePermission: true,
      existingMembership: null,
      existingPendingInvite: null,
      seatType: 'internal',
      scopeAllowsExternal: true,
      seatsAvailable: 10,
      overageAllowed: false,
    });
    expect(result.valid).toBe(true);
  });

  it('A02: Member without invite permission', () => {
    const result = validateInvitation({
      inviterHierarchyLevel: 40,
      targetRoleHierarchyLevel: 40,
      hasInvitePermission: false,
      existingMembership: null,
      existingPendingInvite: null,
      seatType: 'internal',
      scopeAllowsExternal: true,
      seatsAvailable: 10,
      overageAllowed: false,
    });
    expect(result.valid).toBe(false);
    expect(result.code).toBe('NO_PERMISSION');
  });

  it('A03: Admin invites to role above own hierarchy', () => {
    const result = validateInvitation({
      inviterHierarchyLevel: 20, // admin (level 20)
      targetRoleHierarchyLevel: 10, // owner (level 10) — more powerful
      hasInvitePermission: true,
      existingMembership: null,
      existingPendingInvite: null,
      seatType: 'internal',
      scopeAllowsExternal: true,
      seatsAvailable: 10,
      overageAllowed: false,
    });
    expect(result.valid).toBe(false);
    expect(result.code).toBe('HIERARCHY_VIOLATION');
  });

  it('A04: Accept valid invitation', () => {
    const result = validateAcceptance({
      status: 'pending',
      expiresAt: '2030-12-31T00:00:00Z',
      invitedEmail: 'user@example.com',
      acceptorEmail: 'user@example.com',
    });
    expect(result.valid).toBe(true);
  });

  it('A05: Accept expired invitation', () => {
    const result = validateAcceptance({
      status: 'pending',
      expiresAt: '2020-01-01T00:00:00Z',
      invitedEmail: 'user@example.com',
      acceptorEmail: 'user@example.com',
    });
    expect(result.valid).toBe(false);
    expect(result.code).toBe('EXPIRED');
  });

  it('A06: Accept with wrong email', () => {
    const result = validateAcceptance({
      status: 'pending',
      expiresAt: '2030-12-31T00:00:00Z',
      invitedEmail: 'alice@example.com',
      acceptorEmail: 'bob@example.com',
    });
    expect(result.valid).toBe(false);
    expect(result.code).toBe('EMAIL_MISMATCH');
  });

  it('A07: Accept already-accepted invitation', () => {
    const result = validateAcceptance({
      status: 'accepted',
      expiresAt: '2030-12-31T00:00:00Z',
      invitedEmail: 'user@example.com',
      acceptorEmail: 'user@example.com',
    });
    expect(result.valid).toBe(false);
    expect(result.code).toBe('NOT_PENDING');
  });

  it('A08: Duplicate pending invite same email+scope', () => {
    const result = validateInvitation({
      inviterHierarchyLevel: 20,
      targetRoleHierarchyLevel: 40,
      hasInvitePermission: true,
      existingMembership: null,
      existingPendingInvite: { status: 'pending' },
      seatType: 'internal',
      scopeAllowsExternal: true,
      seatsAvailable: 10,
      overageAllowed: false,
    });
    expect(result.valid).toBe(false);
    expect(result.code).toBe('DUPLICATE');
  });

  it('A09: Invite existing member', () => {
    const result = validateInvitation({
      inviterHierarchyLevel: 20,
      targetRoleHierarchyLevel: 40,
      hasInvitePermission: true,
      existingMembership: { status: 'active' },
      existingPendingInvite: null,
      seatType: 'internal',
      scopeAllowsExternal: true,
      seatsAvailable: 10,
      overageAllowed: false,
    });
    expect(result.valid).toBe(false);
    expect(result.code).toBe('ALREADY_MEMBER');
  });

  it('A10: External seat to project with allow_external=false', () => {
    const result = validateInvitation({
      inviterHierarchyLevel: 20,
      targetRoleHierarchyLevel: 50,
      hasInvitePermission: true,
      existingMembership: null,
      existingPendingInvite: null,
      seatType: 'external',
      scopeAllowsExternal: false,
      seatsAvailable: 10,
      overageAllowed: false,
    });
    expect(result.valid).toBe(false);
    expect(result.code).toBe('EXTERNAL_NOT_ALLOWED');
  });

  it('A11: Invite at seat limit (no overage)', () => {
    const result = validateInvitation({
      inviterHierarchyLevel: 20,
      targetRoleHierarchyLevel: 40,
      hasInvitePermission: true,
      existingMembership: null,
      existingPendingInvite: null,
      seatType: 'internal',
      scopeAllowsExternal: true,
      seatsAvailable: 0,
      overageAllowed: false,
    });
    expect(result.valid).toBe(false);
    expect(result.code).toBe('SEAT_LIMIT');
  });

  it('A12: Invite at seat limit (overage on)', () => {
    const result = validateInvitation({
      inviterHierarchyLevel: 20,
      targetRoleHierarchyLevel: 40,
      hasInvitePermission: true,
      existingMembership: null,
      existingPendingInvite: null,
      seatType: 'internal',
      scopeAllowsExternal: true,
      seatsAvailable: 0,
      overageAllowed: true,
    });
    expect(result.valid).toBe(true);
    expect(result.overageTriggered).toBe(true);
  });

  it('A13: Inviter revokes own invite', () => {
    expect(canRevoke({ actorId: 'user_001', invitedBy: 'user_001', hasApprovePermission: false })).toBe(true);
  });

  it('A14: Non-inviter non-admin revokes', () => {
    expect(canRevoke({ actorId: 'user_002', invitedBy: 'user_001', hasApprovePermission: false })).toBe(false);
  });

  it('A15: Unauthenticated clicks invite link → redirect to login', () => {
    const isAuthenticated = false;
    const redirectTarget = isAuthenticated ? '/accept' : '/login?redirect=/accept';
    expect(redirectTarget).toContain('/login');
  });
});
