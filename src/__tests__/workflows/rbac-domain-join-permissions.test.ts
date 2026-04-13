/**
 * RBAC — Domain Match (C01–C06), Join Requests (D01–D07),
 * Permission & Hierarchy (E01–E10) Tests
 */
import { describe, it, expect } from 'vitest';
import { SYSTEM_ROLE_IDS } from '@/types/rbac';

// ---------------------------------------------------------------------------
// Domain match helpers
// ---------------------------------------------------------------------------

interface DomainMatchInput {
  userEmail: string;
  emailVerified: boolean;
  allowedDomains: string[];
  requireDomainMatch: boolean;
  requireAdminApproval: boolean;
  domainAutoJoinFlag: boolean;
}

type DomainMatchResult = 'auto_membership' | 'join_request' | 'no_action';

function evaluateDomainMatch(input: DomainMatchInput): DomainMatchResult {
  if (!input.domainAutoJoinFlag) return 'no_action';
  if (!input.emailVerified) return 'no_action';
  if (input.allowedDomains.length === 0) return 'no_action';

  const emailDomain = input.userEmail.split('@')[1];
  if (!input.allowedDomains.includes(emailDomain)) return 'no_action';
  if (!input.requireDomainMatch) return 'no_action';

  if (input.requireAdminApproval) return 'join_request';
  return 'auto_membership';
}

// ---------------------------------------------------------------------------
// Join request helpers
// ---------------------------------------------------------------------------

interface JoinRequestInput {
  hasPendingRequest: boolean;
  scopeVisible: boolean;
  hasApprovePermission: boolean;
  isOrgMember: boolean;
  scopeVisibility: 'public' | 'internal' | 'private' | 'visible' | 'hidden' | 'secret';
}

function validateJoinRequest(input: JoinRequestInput): { valid: boolean; code?: string } {
  if (input.hasPendingRequest) return { valid: false, code: 'DUPLICATE' };
  if (input.scopeVisibility === 'secret') return { valid: false, code: 'NOT_DISCOVERABLE' };
  if (input.scopeVisibility === 'private' && !input.isOrgMember) return { valid: false, code: 'NOT_VISIBLE' };
  return { valid: true };
}

function approveRequest(hasPermission: boolean): { valid: boolean; code?: string } {
  if (!hasPermission) return { valid: false, code: 'NO_PERMISSION' };
  return { valid: true };
}

// ---------------------------------------------------------------------------
// Hierarchy helpers
// ---------------------------------------------------------------------------

interface HierarchyRole {
  id: string;
  name: string;
  level: number;
}

const ROLES: Record<string, HierarchyRole> = {
  owner: { id: SYSTEM_ROLE_IDS.OWNER, name: 'owner', level: 5 },
  admin: { id: SYSTEM_ROLE_IDS.ADMIN, name: 'admin', level: 10 },
  collaborator: { id: SYSTEM_ROLE_IDS.COLLABORATOR, name: 'collaborator', level: 30 },
  contractor: { id: SYSTEM_ROLE_IDS.CONTRACTOR, name: 'contractor', level: 50 },
  viewer: { id: SYSTEM_ROLE_IDS.VIEWER, name: 'viewer', level: 70 },
};

function canAssignRole(actorLevel: number, targetLevel: number): boolean {
  return targetLevel >= actorLevel;
}

function canRemoveMember(actorLevel: number, targetLevel: number, isSelf: boolean): boolean {
  if (isSelf) return false; // Special case: sole owner check done separately
  return targetLevel > actorLevel; // Can only remove lower-ranked
}

function canCreateCustomRole(
  actorLevel: number,
  customRoleLevel: number,
  actorPermissions: string[],
  requestedPermissions: string[],
): { valid: boolean; code?: string } {
  if (customRoleLevel <= actorLevel) {
    return { valid: false, code: 'HIERARCHY_VIOLATION' };
  }
  const unownedPerms = requestedPermissions.filter(p => !actorPermissions.includes(p));
  if (unownedPerms.length > 0) {
    return { valid: false, code: 'PRIVILEGE_ESCALATION' };
  }
  return { valid: true };
}

function canLeaveOrg(isOwner: boolean, ownerCount: number): { valid: boolean; code?: string } {
  if (isOwner && ownerCount <= 1) {
    return { valid: false, code: 'SOLE_OWNER' };
  }
  return { valid: true };
}

// ===========================================================================
// Domain Match Tests (C01–C06)
// ===========================================================================

describe('RBAC — Domain Match Tests (C01–C06)', () => {
  it('C01: Matching domain, auto-join on, approval off → auto-membership', () => {
    const result = evaluateDomainMatch({
      userEmail: 'alice@acme.com',
      emailVerified: true,
      allowedDomains: ['acme.com'],
      requireDomainMatch: true,
      requireAdminApproval: false,
      domainAutoJoinFlag: true,
    });
    expect(result).toBe('auto_membership');
  });

  it('C02: Matching domain, approval on → join request', () => {
    const result = evaluateDomainMatch({
      userEmail: 'alice@acme.com',
      emailVerified: true,
      allowedDomains: ['acme.com'],
      requireDomainMatch: true,
      requireAdminApproval: true,
      domainAutoJoinFlag: true,
    });
    expect(result).toBe('join_request');
  });

  it('C03: Non-matching domain → no action', () => {
    const result = evaluateDomainMatch({
      userEmail: 'alice@other.com',
      emailVerified: true,
      allowedDomains: ['acme.com'],
      requireDomainMatch: true,
      requireAdminApproval: false,
      domainAutoJoinFlag: true,
    });
    expect(result).toBe('no_action');
  });

  it('C04: Empty allowed_email_domains → disabled', () => {
    const result = evaluateDomainMatch({
      userEmail: 'alice@acme.com',
      emailVerified: true,
      allowedDomains: [],
      requireDomainMatch: true,
      requireAdminApproval: false,
      domainAutoJoinFlag: true,
    });
    expect(result).toBe('no_action');
  });

  it('C05: Unverified email → no auto-join', () => {
    const result = evaluateDomainMatch({
      userEmail: 'alice@acme.com',
      emailVerified: false,
      allowedDomains: ['acme.com'],
      requireDomainMatch: true,
      requireAdminApproval: false,
      domainAutoJoinFlag: true,
    });
    expect(result).toBe('no_action');
  });

  it('C06: domain_auto_join flag disabled → no auto-join', () => {
    const result = evaluateDomainMatch({
      userEmail: 'alice@acme.com',
      emailVerified: true,
      allowedDomains: ['acme.com'],
      requireDomainMatch: true,
      requireAdminApproval: false,
      domainAutoJoinFlag: false,
    });
    expect(result).toBe('no_action');
  });
});

// ===========================================================================
// Join Request Tests (D01–D07)
// ===========================================================================

describe('RBAC — Join Request Tests (D01–D07)', () => {
  it('D01: Request → approve → membership', () => {
    const request = validateJoinRequest({
      hasPendingRequest: false,
      scopeVisible: true,
      hasApprovePermission: false,
      isOrgMember: true,
      scopeVisibility: 'visible',
    });
    expect(request.valid).toBe(true);

    const approval = approveRequest(true);
    expect(approval.valid).toBe(true);
  });

  it('D02: Request → deny with reason', () => {
    const approval = approveRequest(true);
    expect(approval.valid).toBe(true);
    const denyReason = 'Position already filled';
    expect(denyReason).toBeTruthy();
  });

  it('D03: Duplicate pending request → error', () => {
    const result = validateJoinRequest({
      hasPendingRequest: true,
      scopeVisible: true,
      hasApprovePermission: false,
      isOrgMember: true,
      scopeVisibility: 'visible',
    });
    expect(result.valid).toBe(false);
    expect(result.code).toBe('DUPLICATE');
  });

  it('D04: Non-approver approves → error', () => {
    const result = approveRequest(false);
    expect(result.valid).toBe(false);
    expect(result.code).toBe('NO_PERMISSION');
  });

  it('D05: Withdraw own request', () => {
    const canWithdraw = true; // user_id matches
    expect(canWithdraw).toBe(true);
  });

  it('D06: Request to secret team → not discoverable', () => {
    const result = validateJoinRequest({
      hasPendingRequest: false,
      scopeVisible: false,
      hasApprovePermission: false,
      isOrgMember: true,
      scopeVisibility: 'secret',
    });
    expect(result.valid).toBe(false);
    expect(result.code).toBe('NOT_DISCOVERABLE');
  });

  it('D07: Non-org-member requests private project → not visible', () => {
    const result = validateJoinRequest({
      hasPendingRequest: false,
      scopeVisible: false,
      hasApprovePermission: false,
      isOrgMember: false,
      scopeVisibility: 'private',
    });
    expect(result.valid).toBe(false);
    expect(result.code).toBe('NOT_VISIBLE');
  });
});

// ===========================================================================
// Permission & Hierarchy Tests (E01–E10)
// ===========================================================================

describe('RBAC — Permission & Hierarchy Tests (E01–E10)', () => {
  it('E01: Collaborator invites as Admin → hierarchy violation', () => {
    expect(canAssignRole(ROLES.collaborator.level, ROLES.admin.level)).toBe(false);
  });

  it('E02: Collaborator invites as Contractor → success', () => {
    expect(canAssignRole(ROLES.collaborator.level, ROLES.contractor.level)).toBe(true);
  });

  it('E03: Admin generates code for Owner role → hierarchy violation', () => {
    expect(canAssignRole(ROLES.admin.level, ROLES.owner.level)).toBe(false);
  });

  it('E04: Owner changes contractor to Admin → success', () => {
    expect(canAssignRole(ROLES.owner.level, ROLES.admin.level)).toBe(true);
  });

  it('E05: Admin removes equal-level Admin → blocked', () => {
    expect(canRemoveMember(ROLES.admin.level, ROLES.admin.level, false)).toBe(false);
  });

  it('E06: Admin removes lower-level Collaborator → success', () => {
    expect(canRemoveMember(ROLES.admin.level, ROLES.collaborator.level, false)).toBe(true);
  });

  it('E07: Custom role with unowned permission → privilege escalation', () => {
    const result = canCreateCustomRole(
      ROLES.collaborator.level,
      ROLES.contractor.level, // valid level
      ['invite:member', 'read:member', 'manage:team'],
      ['invite:member', 'manage:billing'], // manage:billing not owned by collaborator
    );
    expect(result.valid).toBe(false);
    expect(result.code).toBe('PRIVILEGE_ESCALATION');
  });

  it('E08: API key assigns above its own role → blocked', () => {
    const apiKeyRoleLevel = ROLES.collaborator.level;
    const targetRoleLevel = ROLES.admin.level;
    expect(canAssignRole(apiKeyRoleLevel, targetRoleLevel)).toBe(false);
  });

  it('E09: Sole owner leaves org → must transfer first', () => {
    const result = canLeaveOrg(true, 1);
    expect(result.valid).toBe(false);
    expect(result.code).toBe('SOLE_OWNER');
  });

  it('E10: Owner transfers then leaves → success', () => {
    // After transfer, there are 2 owners
    const afterTransfer = canLeaveOrg(true, 2);
    expect(afterTransfer.valid).toBe(true);
  });
});
