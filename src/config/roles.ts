/**
 * Canonical role label registry — SSOT for human-readable role names.
 *
 * Every component that displays a role label MUST import from here.
 * Do NOT duplicate this mapping elsewhere in the codebase.
 *
 * @module config/roles
 */

export const ROLE_LABELS: Record<string, string> = {
  developer: 'Developer',
  owner: 'Owner',
  admin: 'Admin',
  controller: 'Controller',
  collaborator: 'Collaborator',
  contractor: 'Contractor',
  crew: 'Crew',
  client: 'Client',
  viewer: 'Viewer',
  community: 'Community',
};

/** i18n key map for role labels */
export const ROLE_I18N_KEYS: Record<string, string> = {
  developer: 'user.developer',
  owner: 'user.owner',
  admin: 'user.admin',
  controller: 'user.controller',
  collaborator: 'user.collaborator',
  contractor: 'user.contractor',
  crew: 'user.crew',
  client: 'user.client',
  viewer: 'user.viewer',
  community: 'user.community',
};

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}
