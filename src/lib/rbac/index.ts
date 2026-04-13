/**
 * RBAC — Module Index
 *
 * Central export for all RBAC (auth, roles, permissions, seats) modules.
 */
export { checkPermission, enforceHierarchyCeiling, isSoleOwner } from './permissions';
export { checkSeatAvailability, incrementSeatUsage, decrementSeatUsage, reconcileSeats } from './seats';
export { evaluateFlag, evaluateAllFlags, isFeatureEnabled } from './feature-flags';
export { writeAuditLog, extractIpAddress, extractUserAgent } from './audit';
export { validateInvitation, validateInviteCodeRedemption, validateJoinRequest } from './validators';
