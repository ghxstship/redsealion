/**
 * RBAC — Project Role Permission Matrix Tests
 *
 * Covers closure tickets C-RBAC-01, C-RBAC-02, C-RBAC-03 from
 * docs/audit/role-lifecycle/05-closure-plan.md.
 *
 * Asserts:
 *   1. The 12 canonical project roles are registered with UUIDs.
 *   2. DEFAULT_PROJECT_PERMISSIONS grants the expected baseline per role.
 *   3. Unlisted {role, resource, action} tuples deny by default.
 *   4. Legacy view/edit vocabulary maps to RPC read/update.
 */

import { describe, it, expect } from 'vitest';
import { SYSTEM_ROLE_IDS, getProjectRoleId } from '@/types/rbac';
import {
  DEFAULT_PROJECT_PERMISSIONS,
  getDefaultProjectPermission,
  type ProjectRole,
} from '@/lib/permissions';

const ALL_PROJECT_ROLES: ProjectRole[] = [
  'executive', 'production', 'management', 'crew', 'staff', 'talent',
  'vendor', 'client', 'sponsor', 'press', 'guest', 'attendee',
];

describe('SYSTEM_ROLE_IDS — canonical project role registration', () => {
  it('defines a UUID constant for each of the 12 canonical project roles', () => {
    expect(SYSTEM_ROLE_IDS.PROJECT_EXECUTIVE ).toBe('00000000-0000-0000-0000-000000000301');
    expect(SYSTEM_ROLE_IDS.PROJECT_PRODUCTION).toBe('00000000-0000-0000-0000-000000000302');
    expect(SYSTEM_ROLE_IDS.PROJECT_MANAGEMENT).toBe('00000000-0000-0000-0000-000000000303');
    expect(SYSTEM_ROLE_IDS.PROJECT_CREW      ).toBe('00000000-0000-0000-0000-000000000304');
    expect(SYSTEM_ROLE_IDS.PROJECT_STAFF     ).toBe('00000000-0000-0000-0000-000000000305');
    expect(SYSTEM_ROLE_IDS.PROJECT_TALENT    ).toBe('00000000-0000-0000-0000-000000000306');
    expect(SYSTEM_ROLE_IDS.PROJECT_VENDOR    ).toBe('00000000-0000-0000-0000-000000000307');
    expect(SYSTEM_ROLE_IDS.PROJECT_CLIENT    ).toBe('00000000-0000-0000-0000-000000000308');
    expect(SYSTEM_ROLE_IDS.PROJECT_SPONSOR   ).toBe('00000000-0000-0000-0000-000000000309');
    expect(SYSTEM_ROLE_IDS.PROJECT_PRESS     ).toBe('00000000-0000-0000-0000-000000000310');
    expect(SYSTEM_ROLE_IDS.PROJECT_GUEST     ).toBe('00000000-0000-0000-0000-000000000311');
    expect(SYSTEM_ROLE_IDS.PROJECT_ATTENDEE  ).toBe('00000000-0000-0000-0000-000000000312');
  });

  it('getProjectRoleId() resolves every enum slug', () => {
    const uuids = new Set<string>();
    for (const slug of ALL_PROJECT_ROLES) {
      const uuid = getProjectRoleId(slug);
      expect(uuid).toBeDefined();
      expect(uuid).toMatch(/^00000000-0000-0000-0000-00000000030\d|^00000000-0000-0000-0000-00000000031[0-2]$/);
      uuids.add(uuid!);
    }
    expect(uuids.size).toBe(12);
  });

  it('getProjectRoleId() returns undefined for unknown slugs', () => {
    expect(getProjectRoleId('creator')).toBeUndefined();
    expect(getProjectRoleId('collaborator')).toBeUndefined();
    expect(getProjectRoleId('viewer')).toBeUndefined();
    expect(getProjectRoleId('')).toBeUndefined();
  });
});

describe('DEFAULT_PROJECT_PERMISSIONS — matrix presence', () => {
  it('has an entry for every canonical project role', () => {
    for (const role of ALL_PROJECT_ROLES) {
      expect(DEFAULT_PROJECT_PERMISSIONS[role]).toBeDefined();
    }
  });
});

describe('Executive — governance role', () => {
  it('has approve authority over projects, advances, invoices, budgets', () => {
    expect(getDefaultProjectPermission('executive', 'projects',       'approve')).toBe(true);
    expect(getDefaultProjectPermission('executive', 'advances',       'approve')).toBe(true);
    expect(getDefaultProjectPermission('executive', 'invoices',       'approve')).toBe(true);
    expect(getDefaultProjectPermission('executive', 'budgets',        'approve')).toBe(true);
    expect(getDefaultProjectPermission('executive', 'purchase_orders','approve')).toBe(true);
  });
});

describe('Production — operational governance', () => {
  it('can create events + activations + advances', () => {
    expect(getDefaultProjectPermission('production', 'events',     'create')).toBe(true);
    expect(getDefaultProjectPermission('production', 'activations','create')).toBe(true);
    expect(getDefaultProjectPermission('production', 'advances',   'create')).toBe(true);
    expect(getDefaultProjectPermission('production', 'crew',       'invite')).toBe(true);
  });

  it('cannot approve budgets or delete projects', () => {
    expect(getDefaultProjectPermission('production', 'budgets',  'approve')).toBe(false);
    expect(getDefaultProjectPermission('production', 'projects', 'delete')).toBe(false);
  });
});

describe('Crew — fulfillment role', () => {
  it('can update tasks + create time entries', () => {
    expect(getDefaultProjectPermission('crew', 'tasks',         'update')).toBe(true);
    expect(getDefaultProjectPermission('crew', 'time_tracking', 'create')).toBe(true);
  });

  it('cannot read invoices, settings, or reports', () => {
    expect(getDefaultProjectPermission('crew', 'invoices',        'read')).toBe(false);
    expect(getDefaultProjectPermission('crew', 'settings',        'read')).toBe(false);
    expect(getDefaultProjectPermission('crew', 'reports',         'read')).toBe(false);
    expect(getDefaultProjectPermission('crew', 'purchase_orders', 'read')).toBe(false);
  });

  it('cannot manage crew, create events, or approve anything', () => {
    expect(getDefaultProjectPermission('crew', 'crew',     'manage')).toBe(false);
    expect(getDefaultProjectPermission('crew', 'events',   'create')).toBe(false);
    expect(getDefaultProjectPermission('crew', 'advances', 'approve')).toBe(false);
  });
});

describe('Vendor — external supplier', () => {
  it('can read + update advances, create + update invoices, read POs', () => {
    expect(getDefaultProjectPermission('vendor', 'advances',        'update')).toBe(true);
    expect(getDefaultProjectPermission('vendor', 'invoices',        'create')).toBe(true);
    expect(getDefaultProjectPermission('vendor', 'invoices',        'update')).toBe(true);
    expect(getDefaultProjectPermission('vendor', 'purchase_orders', 'read')).toBe(true);
  });

  it('cannot approve POs, read budgets, or access reports', () => {
    expect(getDefaultProjectPermission('vendor', 'purchase_orders','approve')).toBe(false);
    expect(getDefaultProjectPermission('vendor', 'budgets',        'read')).toBe(false);
    expect(getDefaultProjectPermission('vendor', 'reports',        'read')).toBe(false);
  });
});

describe('Client — read + approve only', () => {
  it('can approve proposals and invoices; read reports + events', () => {
    expect(getDefaultProjectPermission('client', 'proposals','approve')).toBe(true);
    expect(getDefaultProjectPermission('client', 'invoices', 'approve')).toBe(true);
    expect(getDefaultProjectPermission('client', 'reports',  'read')).toBe(true);
    expect(getDefaultProjectPermission('client', 'events',   'read')).toBe(true);
  });

  it('cannot create, update, or delete anything project-operational', () => {
    expect(getDefaultProjectPermission('client', 'events',  'create')).toBe(false);
    expect(getDefaultProjectPermission('client', 'tasks',   'create')).toBe(false);
    expect(getDefaultProjectPermission('client', 'advances','update')).toBe(false);
    expect(getDefaultProjectPermission('client', 'crew',    'invite')).toBe(false);
  });
});

describe('Guest / Attendee — consumer surface', () => {
  it.each(['guest','attendee'] as ProjectRole[])('%s can only read events', (role) => {
    expect(getDefaultProjectPermission(role, 'events',   'read')).toBe(true);

    // No other grants
    expect(getDefaultProjectPermission(role, 'invoices', 'read')).toBe(false);
    expect(getDefaultProjectPermission(role, 'crew',     'read')).toBe(false);
    expect(getDefaultProjectPermission(role, 'tasks',    'read')).toBe(false);
    expect(getDefaultProjectPermission(role, 'settings', 'read')).toBe(false);
    expect(getDefaultProjectPermission(role, 'reports',  'read')).toBe(false);
  });
});

describe('Press — credentialed media access only', () => {
  it('can read events + files', () => {
    expect(getDefaultProjectPermission('press', 'events', 'read')).toBe(true);
    expect(getDefaultProjectPermission('press', 'files',  'read')).toBe(true);
  });

  it('cannot access crew, finance, or settings', () => {
    expect(getDefaultProjectPermission('press', 'crew',     'read')).toBe(false);
    expect(getDefaultProjectPermission('press', 'finance',  'read')).toBe(false);
    expect(getDefaultProjectPermission('press', 'settings', 'read')).toBe(false);
  });
});

describe('Sponsor — activation/brand read only', () => {
  it('can read activations + events + reports', () => {
    expect(getDefaultProjectPermission('sponsor', 'activations','read')).toBe(true);
    expect(getDefaultProjectPermission('sponsor', 'events',     'read')).toBe(true);
    expect(getDefaultProjectPermission('sponsor', 'reports',    'read')).toBe(true);
  });

  it('cannot approve or modify anything', () => {
    expect(getDefaultProjectPermission('sponsor', 'activations','update')).toBe(false);
    expect(getDefaultProjectPermission('sponsor', 'reports',    'approve')).toBe(false);
    expect(getDefaultProjectPermission('sponsor', 'invoices',   'read')).toBe(false);
  });
});

describe('Action vocabulary bridge', () => {
  it('maps legacy app action "view" to RPC "read"', () => {
    expect(getDefaultProjectPermission('executive', 'projects', 'view')).toBe(true);
    expect(getDefaultProjectPermission('guest',     'events',   'view')).toBe(true);
  });

  it('maps legacy app action "edit" to RPC "update"', () => {
    expect(getDefaultProjectPermission('production','events','edit')).toBe(true);
    expect(getDefaultProjectPermission('crew',      'tasks', 'edit')).toBe(true);
  });

  it('denies guest/attendee on edit/update for any resource', () => {
    expect(getDefaultProjectPermission('guest',    'events','edit')).toBe(false);
    expect(getDefaultProjectPermission('attendee', 'events','edit')).toBe(false);
  });
});

describe('Deny-by-default semantics', () => {
  it('returns false for unknown {role, resource, action} tuples', () => {
    // proposals.create is not granted to crew
    expect(getDefaultProjectPermission('crew', 'proposals', 'create')).toBe(false);
    // settings.delete is not granted to any project role
    for (const role of ALL_PROJECT_ROLES) {
      expect(getDefaultProjectPermission(role, 'settings', 'delete')).toBe(false);
    }
  });
});
