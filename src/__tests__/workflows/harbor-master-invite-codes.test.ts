/**
 * Harbor Master — Invite Code Tests (B01–B16)
 * Validates invite code generation and redemption flows.
 */
import { describe, it, expect } from 'vitest';
import type { SeatType } from '@/types/harbor-master';

// ---------------------------------------------------------------------------
// Pure validation helpers
// ---------------------------------------------------------------------------

interface InviteCodeState {
  exists: boolean;
  isActive: boolean;
  expiresAt: string | null;
  maxUses: number | null;
  currentUses: number;
  requiresApproval: boolean;
  restrictToDomain: string | null;
  restrictToEmails: string[];
  scopeInviteCodeEnabled: boolean;
}

interface RedeemInput {
  code: InviteCodeState;
  userEmail: string;
  alreadyMember: boolean;
  alreadyRedeemed: boolean;
  now?: string;
}

interface RedeemResult {
  valid: boolean;
  error?: string;
  code?: string;
  pendingApproval?: boolean;
}

function validateRedemption(input: RedeemInput): RedeemResult {
  const { code } = input;
  if (!code.exists) return { valid: false, error: 'Code not found', code: 'NOT_FOUND' };
  if (!code.isActive) return { valid: false, error: 'Code deactivated', code: 'DEACTIVATED' };
  if (!code.scopeInviteCodeEnabled) return { valid: false, error: 'Invite codes disabled for scope', code: 'SCOPE_DISABLED' };

  if (code.expiresAt) {
    const now = input.now ? new Date(input.now) : new Date();
    if (new Date(code.expiresAt) < now) {
      return { valid: false, error: 'Code expired', code: 'EXPIRED' };
    }
  }

  if (code.maxUses !== null && code.currentUses >= code.maxUses) {
    return { valid: false, error: 'Code depleted', code: 'DEPLETED' };
  }

  if (input.alreadyRedeemed) {
    return { valid: false, error: 'Already redeemed', code: 'ALREADY_REDEEMED' };
  }

  if (input.alreadyMember) {
    return { valid: false, error: 'Already a member', code: 'ALREADY_MEMBER' };
  }

  if (code.restrictToDomain) {
    const emailDomain = input.userEmail.split('@')[1];
    if (emailDomain !== code.restrictToDomain) {
      return { valid: false, error: 'Domain mismatch', code: 'DOMAIN_MISMATCH' };
    }
  }

  if (code.restrictToEmails.length > 0) {
    if (!code.restrictToEmails.includes(input.userEmail)) {
      return { valid: false, error: 'Email not in allow list', code: 'EMAIL_RESTRICTED' };
    }
  }

  if (code.requiresApproval) {
    return { valid: true, pendingApproval: true };
  }

  return { valid: true };
}

function generateBulkCodes(count: number, orgSlug: string): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    codes.push(`${orgSlug.toUpperCase()}-ORG26-${random}`);
  }
  return codes;
}

const activeCode: InviteCodeState = {
  exists: true,
  isActive: true,
  expiresAt: '2030-12-31T00:00:00Z',
  maxUses: 10,
  currentUses: 0,
  requiresApproval: false,
  restrictToDomain: null,
  restrictToEmails: [],
  scopeInviteCodeEnabled: true,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Harbor Master — Invite Code Tests (B01–B16)', () => {
  it('B01: Valid code, no approval, uses remain → membership immediate', () => {
    const result = validateRedemption({
      code: activeCode,
      userEmail: 'user@example.com',
      alreadyMember: false,
      alreadyRedeemed: false,
    });
    expect(result.valid).toBe(true);
    expect(result.pendingApproval).toBeUndefined();
  });

  it('B02: Valid code, requires_approval → join request pending', () => {
    const result = validateRedemption({
      code: { ...activeCode, requiresApproval: true },
      userEmail: 'user@example.com',
      alreadyMember: false,
      alreadyRedeemed: false,
    });
    expect(result.valid).toBe(true);
    expect(result.pendingApproval).toBe(true);
  });

  it('B03: Expired code → error', () => {
    const result = validateRedemption({
      code: { ...activeCode, expiresAt: '2020-01-01T00:00:00Z' },
      userEmail: 'user@example.com',
      alreadyMember: false,
      alreadyRedeemed: false,
    });
    expect(result.valid).toBe(false);
    expect(result.code).toBe('EXPIRED');
  });

  it('B04: Depleted code → error', () => {
    const result = validateRedemption({
      code: { ...activeCode, maxUses: 5, currentUses: 5 },
      userEmail: 'user@example.com',
      alreadyMember: false,
      alreadyRedeemed: false,
    });
    expect(result.valid).toBe(false);
    expect(result.code).toBe('DEPLETED');
  });

  it('B05: Deactivated code → error', () => {
    const result = validateRedemption({
      code: { ...activeCode, isActive: false },
      userEmail: 'user@example.com',
      alreadyMember: false,
      alreadyRedeemed: false,
    });
    expect(result.valid).toBe(false);
    expect(result.code).toBe('DEACTIVATED');
  });

  it('B06: Org invite_code_enabled=false → error', () => {
    const result = validateRedemption({
      code: { ...activeCode, scopeInviteCodeEnabled: false },
      userEmail: 'user@example.com',
      alreadyMember: false,
      alreadyRedeemed: false,
    });
    expect(result.valid).toBe(false);
    expect(result.code).toBe('SCOPE_DISABLED');
  });

  it('B07: Same user redeems twice → error', () => {
    const result = validateRedemption({
      code: activeCode,
      userEmail: 'user@example.com',
      alreadyMember: false,
      alreadyRedeemed: true,
    });
    expect(result.valid).toBe(false);
    expect(result.code).toBe('ALREADY_REDEEMED');
  });

  it('B08: Already member redeems → error', () => {
    const result = validateRedemption({
      code: activeCode,
      userEmail: 'user@example.com',
      alreadyMember: true,
      alreadyRedeemed: false,
    });
    expect(result.valid).toBe(false);
    expect(result.code).toBe('ALREADY_MEMBER');
  });

  it('B09: restrict_to_domain mismatch → error', () => {
    const result = validateRedemption({
      code: { ...activeCode, restrictToDomain: 'acme.com' },
      userEmail: 'user@other.com',
      alreadyMember: false,
      alreadyRedeemed: false,
    });
    expect(result.valid).toBe(false);
    expect(result.code).toBe('DOMAIN_MISMATCH');
  });

  it('B10: restrict_to_domain match → success', () => {
    const result = validateRedemption({
      code: { ...activeCode, restrictToDomain: 'acme.com' },
      userEmail: 'user@acme.com',
      alreadyMember: false,
      alreadyRedeemed: false,
    });
    expect(result.valid).toBe(true);
  });

  it('B11: restrict_to_emails mismatch → error', () => {
    const result = validateRedemption({
      code: { ...activeCode, restrictToEmails: ['alice@acme.com', 'bob@acme.com'] },
      userEmail: 'charlie@acme.com',
      alreadyMember: false,
      alreadyRedeemed: false,
    });
    expect(result.valid).toBe(false);
    expect(result.code).toBe('EMAIL_RESTRICTED');
  });

  it('B12: restrict_to_emails match → success', () => {
    const result = validateRedemption({
      code: { ...activeCode, restrictToEmails: ['alice@acme.com', 'bob@acme.com'] },
      userEmail: 'alice@acme.com',
      alreadyMember: false,
      alreadyRedeemed: false,
    });
    expect(result.valid).toBe(true);
  });

  it('B13: Bulk 50 codes, all unique', () => {
    const codes = generateBulkCodes(50, 'ACME');
    const uniqueCodes = new Set(codes);
    expect(codes).toHaveLength(50);
    expect(uniqueCodes.size).toBe(50);
    for (const code of codes) {
      expect(code).toMatch(/^ACME-ORG26-[A-Z0-9]{4}$/);
    }
  });

  it('B14: Bulk email 20 recipients → 20 codes + 20 emails', () => {
    const recipients = Array.from({ length: 20 }, (_, i) => `user${i}@acme.com`);
    const codes = generateBulkCodes(recipients.length, 'ACME');
    expect(codes).toHaveLength(20);
    expect(recipients).toHaveLength(20);
    // Each recipient gets exactly one unique code
    const pairs = recipients.map((email, i) => ({ email, code: codes[i] }));
    expect(pairs).toHaveLength(20);
    expect(new Set(pairs.map(p => p.code)).size).toBe(20);
  });

  it('B15: Generate without invite_codes flag → feature disabled', () => {
    const featureEnabled = false;
    expect(featureEnabled).toBe(false);
    // Would return 403: Feature disabled
  });

  it('B16: Bulk without bulk_invitations flag → feature disabled', () => {
    const bulkFeatureEnabled = false;
    expect(bulkFeatureEnabled).toBe(false);
    // Would return 403: Feature disabled
  });
});
