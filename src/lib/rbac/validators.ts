/**
 * RBAC — Validation Logic
 *
 * Pure validation functions for all join flows (A–G).
 * These contain the business rules so they can be tested
 * independently of Supabase.
 *
 * @module lib/rbac/validators
 */
import type {
  SeatType,
  Invitation,
  InviteCode,
  OrganizationMembership,
  SeatAllocation,
} from '@/types/rbac';

// ---------------------------------------------------------------------------
// Invitation Validation (Flow A)
// ---------------------------------------------------------------------------

export interface InvitationValidationInput {
  inviterHierarchyLevel: number;
  targetRoleHierarchyLevel: number;
  existingMembership: OrganizationMembership | null;
  existingPendingInvitation: Invitation | null;
  seatType: SeatType;
  scopeAllowsExternal: boolean;
  seatAllocation: SeatAllocation | null;
  hasInvitePermission: boolean;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  code?: string;
}

export function validateInvitation(input: InvitationValidationInput): ValidationResult {
  if (!input.hasInvitePermission) {
    return { valid: false, error: 'Insufficient permissions to send invitations', code: 'NO_PERMISSION' };
  }

  // Hierarchy ceiling: cannot invite to role more powerful than own
  if (input.targetRoleHierarchyLevel < input.inviterHierarchyLevel) {
    return { valid: false, error: 'Cannot invite to a role above your own hierarchy level', code: 'HIERARCHY_VIOLATION' };
  }

  // No existing active membership
  if (input.existingMembership && input.existingMembership.status === 'active') {
    return { valid: false, error: 'User is already a member of this scope', code: 'ALREADY_MEMBER' };
  }

  // No duplicate pending invitation
  if (input.existingPendingInvitation && input.existingPendingInvitation.status === 'pending') {
    return { valid: false, error: 'A pending invitation already exists for this user in this scope', code: 'DUPLICATE_INVITE' };
  }

  // External seat check
  if (input.seatType === 'external' && !input.scopeAllowsExternal) {
    return { valid: false, error: 'External members are not allowed in this scope', code: 'EXTERNAL_NOT_ALLOWED' };
  }

  // Seat limit check
  if (input.seatAllocation) {
    const isInternal = input.seatType === 'internal';
    const included = isInternal
      ? input.seatAllocation.internal_seats_included
      : input.seatAllocation.external_seats_included;
    const purchased = isInternal
      ? input.seatAllocation.internal_seats_purchased
      : input.seatAllocation.external_seats_purchased;
    const used = isInternal
      ? input.seatAllocation.internal_seats_used
      : input.seatAllocation.external_seats_used;
    const available = (included + purchased) - used;

    if (available <= 0 && !input.seatAllocation.overage_allowed) {
      return { valid: false, error: `No ${input.seatType} seats available`, code: 'SEAT_LIMIT' };
    }
  }

  return { valid: true };
}

// ---------------------------------------------------------------------------
// Invite Code Redemption Validation (Flow B)
// ---------------------------------------------------------------------------

export interface InviteCodeRedemptionInput {
  code: InviteCode | null;
  userEmail: string;
  existingMembership: OrganizationMembership | null;
  alreadyRedeemed: boolean;
  scopeInviteCodeEnabled: boolean;
  seatAllocation: SeatAllocation | null;
  inviteCodesFeatureEnabled: boolean;
  isBulk: boolean;
  bulkInvitationsFeatureEnabled: boolean;
}

export function validateInviteCodeRedemption(input: InviteCodeRedemptionInput): ValidationResult {
  // Feature flag check
  if (!input.inviteCodesFeatureEnabled) {
    return { valid: false, error: 'Invite codes feature is not enabled', code: 'FEATURE_DISABLED' };
  }

  if (input.isBulk && !input.bulkInvitationsFeatureEnabled) {
    return { valid: false, error: 'Bulk invitations feature is not enabled', code: 'FEATURE_DISABLED' };
  }

  if (!input.code) {
    return { valid: false, error: 'Invite code not found', code: 'NOT_FOUND' };
  }

  if (!input.code.is_active) {
    return { valid: false, error: 'Invite code has been deactivated', code: 'DEACTIVATED' };
  }

  // Expiry check
  if (input.code.expires_at && new Date(input.code.expires_at) < new Date()) {
    return { valid: false, error: 'Invite code has expired', code: 'EXPIRED' };
  }

  // Depletion check
  if (input.code.max_uses !== null && input.code.current_uses >= input.code.max_uses) {
    return { valid: false, error: 'Invite code has been fully redeemed', code: 'DEPLETED' };
  }

  // Scope toggle
  if (!input.scopeInviteCodeEnabled) {
    return { valid: false, error: 'Invite codes are disabled for this scope', code: 'SCOPE_DISABLED' };
  }

  // Already member
  if (input.existingMembership && input.existingMembership.status === 'active') {
    return { valid: false, error: 'Already a member', code: 'ALREADY_MEMBER' };
  }

  // Already redeemed
  if (input.alreadyRedeemed) {
    return { valid: false, error: 'You have already redeemed this code', code: 'ALREADY_REDEEMED' };
  }

  // Domain restriction
  if (input.code.restrict_to_domain) {
    const emailDomain = input.userEmail.split('@')[1]?.toLowerCase();
    if (emailDomain !== input.code.restrict_to_domain.toLowerCase()) {
      return { valid: false, error: 'Your email domain does not match the required domain', code: 'DOMAIN_MISMATCH' };
    }
  }

  // Email restriction
  if (input.code.restrict_to_emails.length > 0) {
    const normalizedEmail = input.userEmail.toLowerCase();
    const allowedEmails = input.code.restrict_to_emails.map(e => e.toLowerCase());
    if (!allowedEmails.includes(normalizedEmail)) {
      return { valid: false, error: 'Your email is not in the allowed list', code: 'EMAIL_NOT_ALLOWED' };
    }
  }

  // Seat limit
  if (input.seatAllocation) {
    const isInternal = input.code.seat_type === 'internal';
    const included = isInternal
      ? input.seatAllocation.internal_seats_included
      : input.seatAllocation.external_seats_included;
    const purchased = isInternal
      ? input.seatAllocation.internal_seats_purchased
      : input.seatAllocation.external_seats_purchased;
    const used = isInternal
      ? input.seatAllocation.internal_seats_used
      : input.seatAllocation.external_seats_used;
    const available = (included + purchased) - used;

    if (available <= 0 && !input.seatAllocation.overage_allowed) {
      return { valid: false, error: `No ${input.code.seat_type} seats available`, code: 'SEAT_LIMIT' };
    }
  }

  return { valid: true };
}

// ---------------------------------------------------------------------------
// Join Request Validation (Flow D)
// ---------------------------------------------------------------------------

export interface JoinRequestInput {
  existingMembership: OrganizationMembership | null;
  existingPendingRequest: boolean;
  scopeVisibility: string;
  scopeType: string;
  isOrgMember: boolean;
}

export function validateJoinRequest(input: JoinRequestInput): ValidationResult {
  // Already a member
  if (input.existingMembership && input.existingMembership.status === 'active') {
    return { valid: false, error: 'Already a member', code: 'ALREADY_MEMBER' };
  }

  // Duplicate pending
  if (input.existingPendingRequest) {
    return { valid: false, error: 'A pending request already exists', code: 'DUPLICATE_REQUEST' };
  }

  // Secret teams are not discoverable
  if (input.scopeType === 'team' && input.scopeVisibility === 'secret') {
    return { valid: false, error: 'This team is not discoverable', code: 'NOT_DISCOVERABLE' };
  }

  // Private projects require org membership
  if (input.scopeType === 'project' && input.scopeVisibility === 'private' && !input.isOrgMember) {
    return { valid: false, error: 'This project is not visible to non-members', code: 'NOT_VISIBLE' };
  }

  return { valid: true };
}

// ---------------------------------------------------------------------------
// Domain Match Validation (Flow C)
// ---------------------------------------------------------------------------

export interface DomainMatchInput {
  userEmail: string;
  emailVerified: boolean;
  allowedEmailDomains: string[];
  requireDomainMatch: boolean;
  requireAdminApproval: boolean;
  domainAutoJoinEnabled: boolean;
}

export type DomainMatchResult =
  | { action: 'auto_join' }
  | { action: 'join_request' }
  | { action: 'none'; reason: string };

export function evaluateDomainMatch(input: DomainMatchInput): DomainMatchResult {
  // Feature flag check
  if (!input.domainAutoJoinEnabled) {
    return { action: 'none', reason: 'Domain auto-join feature disabled' };
  }

  // Must have verified email
  if (!input.emailVerified) {
    return { action: 'none', reason: 'Email not verified' };
  }

  // No domains configured
  if (input.allowedEmailDomains.length === 0) {
    return { action: 'none', reason: 'No allowed email domains configured' };
  }

  // Check domain match
  const emailDomain = input.userEmail.split('@')[1]?.toLowerCase();
  const domainMatches = input.allowedEmailDomains
    .map(d => d.toLowerCase())
    .includes(emailDomain ?? '');

  if (!domainMatches) {
    return { action: 'none', reason: 'Email domain does not match' };
  }

  if (!input.requireDomainMatch) {
    return { action: 'none', reason: 'Domain matching not enabled' };
  }

  // Domain matches!
  if (input.requireAdminApproval) {
    return { action: 'join_request' };
  }

  return { action: 'auto_join' };
}

// ---------------------------------------------------------------------------
// Session Validation
// ---------------------------------------------------------------------------

export interface SessionValidationInput {
  sessionExists: boolean;
  isActive: boolean;
  expiresAt: string;
  userStatus: string;
  lastActiveAt: string;
  idleTimeoutMinutes: number;
  requireMfa: boolean;
  mfaVerified: boolean;
}

export function validateSession(input: SessionValidationInput): ValidationResult {
  if (!input.sessionExists) {
    return { valid: false, error: 'Session not found', code: 'NO_SESSION' };
  }

  if (!input.isActive) {
    return { valid: false, error: 'Session has been revoked', code: 'REVOKED' };
  }

  if (new Date(input.expiresAt) < new Date()) {
    return { valid: false, error: 'Session has expired', code: 'EXPIRED' };
  }

  if (input.userStatus !== 'active') {
    if (input.userStatus === 'suspended') {
      return { valid: false, error: 'Account is suspended', code: 'SUSPENDED' };
    }
    if (input.userStatus === 'deactivated') {
      return { valid: false, error: 'Account is deactivated', code: 'DEACTIVATED' };
    }
    return { valid: false, error: `Account status: ${input.userStatus}`, code: 'INVALID_STATUS' };
  }

  // Idle timeout check
  const lastActive = new Date(input.lastActiveAt);
  const idleMs = Date.now() - lastActive.getTime();
  const idleLimitMs = input.idleTimeoutMinutes * 60 * 1000;
  if (idleMs > idleLimitMs) {
    return { valid: false, error: 'Session idle timeout exceeded', code: 'IDLE_TIMEOUT' };
  }

  // MFA check
  if (input.requireMfa && !input.mfaVerified) {
    return { valid: false, error: 'MFA verification required', code: 'MFA_REQUIRED' };
  }

  return { valid: true };
}
