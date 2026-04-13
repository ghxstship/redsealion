/**
 * Shared contact role constants.
 * Single source of truth for contact_role enum values.
 * @module lib/clients/contact-roles
 */

const CONTACT_ROLE_OPTIONS = [
  { value: 'primary', label: 'Primary' },
  { value: 'billing', label: 'Billing' },
  { value: 'creative', label: 'Creative' },
  { value: 'operations', label: 'Operations' },
] as const;

const CONTACT_ROLE_MAP: Record<string, string> = Object.fromEntries(
  CONTACT_ROLE_OPTIONS.map((r) => [r.value, r.label])
);

export function roleLabel(role: string): string {
  return CONTACT_ROLE_MAP[role] ?? role;
}
