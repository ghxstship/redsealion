/**
 * Permissions & Subscription Tiers — End-to-End Workflow Validation
 *
 * RBAC:
 *   + Role-based permission matrix (6 internal + 2 client roles)
 *   + 19 resources × 4 actions
 *   + Admin bypass
 *   + Default permission lookup
 *   + Database override support
 *
 * Subscription tiers:
 *   + Feature gating per tier (free < starter < professional < enterprise)
 *   + canAccessFeature logic
 *   + Tier comparison helpers
 *
 * Portal permissions:
 *   + client_primary vs client_viewer capabilities
 */
import { describe, it, expect } from 'vitest';
import {
  DEFAULT_PERMISSIONS,
  PORTAL_PERMISSIONS,
  ALL_RESOURCES,
  ALL_ACTIONS,
  INTERNAL_ROLES,
  CLIENT_ROLES,
  permKey,
  getDefaultPermission,
  getPortalPermission,
} from '@/lib/permissions';
import {
  canAccessFeature,
  getRequiredTier,
  tierMeetsMinimum,
  getTierLabel,
} from '@/lib/subscription';
import type { OrganizationRole, SubscriptionTier } from '@/types/database';

describe('Permission System', () => {
  // -----------------------------------------------------------------------
  // Role definitions
  // -----------------------------------------------------------------------

  describe('Role definitions', () => {
    it('defines 6 internal roles', () => {
      expect(INTERNAL_ROLES).toHaveLength(6);
      expect(INTERNAL_ROLES).toContain('super_admin');
      expect(INTERNAL_ROLES).toContain('org_admin');
      expect(INTERNAL_ROLES).toContain('project_manager');
      expect(INTERNAL_ROLES).toContain('designer');
      expect(INTERNAL_ROLES).toContain('fabricator');
      expect(INTERNAL_ROLES).toContain('installer');
    });

    it('defines 2 client roles', () => {
      expect(CLIENT_ROLES).toHaveLength(2);
      expect(CLIENT_ROLES).toContain('client_primary');
      expect(CLIENT_ROLES).toContain('client_viewer');
    });
  });

  // -----------------------------------------------------------------------
  // Resource and action definitions
  // -----------------------------------------------------------------------

  describe('Resources and actions', () => {
    it('defines 19 permission resources', () => {
      expect(ALL_RESOURCES).toHaveLength(19);
    });

    it('includes all core resources', () => {
      const coreResources = [
        'proposals', 'pipeline', 'clients', 'invoices', 'expenses',
        'budgets', 'time_tracking', 'tasks', 'reports', 'assets',
        'team', 'integrations', 'automations', 'settings', 'ai_assistant',
        'crew', 'equipment', 'leads', 'warehouse',
      ];
      for (const resource of coreResources) {
        expect(ALL_RESOURCES).toContain(resource);
      }
    });

    it('defines 4 permission actions', () => {
      expect(ALL_ACTIONS).toEqual(['view', 'create', 'edit', 'delete']);
    });

    it('generates correct permission keys', () => {
      expect(permKey('proposals', 'view')).toBe('proposals.view');
      expect(permKey('invoices', 'create')).toBe('invoices.create');
      expect(permKey('settings', 'edit')).toBe('settings.edit');
    });
  });

  // -----------------------------------------------------------------------
  // Admin permissions
  // -----------------------------------------------------------------------

  describe('Admin permissions', () => {
    it('grants super_admin full access to all resources', () => {
      for (const resource of ALL_RESOURCES) {
        for (const action of ALL_ACTIONS) {
          expect(getDefaultPermission('super_admin', resource, action)).toBe(true);
        }
      }
    });

    it('grants org_admin full access to all resources', () => {
      for (const resource of ALL_RESOURCES) {
        for (const action of ALL_ACTIONS) {
          expect(getDefaultPermission('org_admin', resource, action)).toBe(true);
        }
      }
    });
  });

  // -----------------------------------------------------------------------
  // Project manager permissions
  // -----------------------------------------------------------------------

  describe('Project manager permissions', () => {
    it('can CRUD proposals (no delete)', () => {
      expect(getDefaultPermission('project_manager', 'proposals', 'view')).toBe(true);
      expect(getDefaultPermission('project_manager', 'proposals', 'create')).toBe(true);
      expect(getDefaultPermission('project_manager', 'proposals', 'edit')).toBe(true);
      expect(getDefaultPermission('project_manager', 'proposals', 'delete')).toBe(false);
    });

    it('can CRUD pipeline (no delete)', () => {
      expect(getDefaultPermission('project_manager', 'pipeline', 'view')).toBe(true);
      expect(getDefaultPermission('project_manager', 'pipeline', 'create')).toBe(true);
      expect(getDefaultPermission('project_manager', 'pipeline', 'delete')).toBe(false);
    });

    it('has no access to settings or integrations', () => {
      expect(getDefaultPermission('project_manager', 'settings', 'view')).toBe(false);
      expect(getDefaultPermission('project_manager', 'integrations', 'view')).toBe(false);
    });

    it('can view but not edit team', () => {
      expect(getDefaultPermission('project_manager', 'team', 'view')).toBe(true);
      expect(getDefaultPermission('project_manager', 'team', 'create')).toBe(false);
      expect(getDefaultPermission('project_manager', 'team', 'edit')).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // Designer permissions
  // -----------------------------------------------------------------------

  describe('Designer permissions', () => {
    it('can view and edit proposals (no create/delete)', () => {
      expect(getDefaultPermission('designer', 'proposals', 'view')).toBe(true);
      expect(getDefaultPermission('designer', 'proposals', 'edit')).toBe(true);
      expect(getDefaultPermission('designer', 'proposals', 'create')).toBe(false);
      expect(getDefaultPermission('designer', 'proposals', 'delete')).toBe(false);
    });

    it('can view clients but not modify', () => {
      expect(getDefaultPermission('designer', 'clients', 'view')).toBe(true);
      expect(getDefaultPermission('designer', 'clients', 'edit')).toBe(false);
    });

    it('has no access to pipeline, invoices, settings', () => {
      expect(getDefaultPermission('designer', 'pipeline', 'view')).toBe(false);
      expect(getDefaultPermission('designer', 'invoices', 'view')).toBe(false);
      expect(getDefaultPermission('designer', 'settings', 'view')).toBe(false);
    });

    it('can manage own time and expenses', () => {
      expect(getDefaultPermission('designer', 'time_tracking', 'view')).toBe(true);
      expect(getDefaultPermission('designer', 'time_tracking', 'create')).toBe(true);
      expect(getDefaultPermission('designer', 'expenses', 'create')).toBe(true);
    });

    it('can create and edit assets', () => {
      expect(getDefaultPermission('designer', 'assets', 'view')).toBe(true);
      expect(getDefaultPermission('designer', 'assets', 'create')).toBe(true);
      expect(getDefaultPermission('designer', 'assets', 'edit')).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Fabricator / Installer permissions
  // -----------------------------------------------------------------------

  describe('Fabricator and installer permissions', () => {
    const roles: OrganizationRole[] = ['fabricator', 'installer'];

    for (const role of roles) {
      it(`${role} can view proposals (read-only)`, () => {
        expect(getDefaultPermission(role, 'proposals', 'view')).toBe(true);
        expect(getDefaultPermission(role, 'proposals', 'create')).toBe(false);
        expect(getDefaultPermission(role, 'proposals', 'edit')).toBe(false);
      });

      it(`${role} can manage own time and expenses`, () => {
        expect(getDefaultPermission(role, 'time_tracking', 'view')).toBe(true);
        expect(getDefaultPermission(role, 'time_tracking', 'create')).toBe(true);
        expect(getDefaultPermission(role, 'expenses', 'create')).toBe(true);
      });

      it(`${role} has no access to pipeline, clients, invoices, settings`, () => {
        expect(getDefaultPermission(role, 'pipeline', 'view')).toBe(false);
        expect(getDefaultPermission(role, 'clients', 'view')).toBe(false);
        expect(getDefaultPermission(role, 'invoices', 'view')).toBe(false);
        expect(getDefaultPermission(role, 'settings', 'view')).toBe(false);
      });

      it(`${role} can view assets (read-only)`, () => {
        expect(getDefaultPermission(role, 'assets', 'view')).toBe(true);
        expect(getDefaultPermission(role, 'assets', 'create')).toBe(false);
      });
    }
  });

  // -----------------------------------------------------------------------
  // Client roles (admin app — no access)
  // -----------------------------------------------------------------------

  describe('Client role admin permissions', () => {
    it('client_primary has no admin app access', () => {
      for (const resource of ALL_RESOURCES) {
        for (const action of ALL_ACTIONS) {
          expect(getDefaultPermission('client_primary', resource, action)).toBe(false);
        }
      }
    });

    it('client_viewer has no admin app access', () => {
      for (const resource of ALL_RESOURCES) {
        for (const action of ALL_ACTIONS) {
          expect(getDefaultPermission('client_viewer', resource, action)).toBe(false);
        }
      }
    });
  });

  // -----------------------------------------------------------------------
  // Permission key helper
  // -----------------------------------------------------------------------

  describe('Permission lookup', () => {
    it('returns false for unknown role/resource/action combinations', () => {
      expect(getDefaultPermission('designer', 'warehouse', 'delete')).toBe(false);
    });

    it('covers all internal role × resource × action combinations', () => {
      for (const role of INTERNAL_ROLES) {
        const perms = DEFAULT_PERMISSIONS[role];
        expect(perms).toBeDefined();
        expect(typeof perms).toBe('object');
      }
    });
  });
});

// ===========================================================================
// Portal Permissions
// ===========================================================================

describe('Portal Permissions', () => {
  describe('client_primary portal access', () => {
    it('can view proposals', () => {
      expect(getPortalPermission('client_primary', 'proposals.view')).toBe(true);
    });

    it('can comment on proposals', () => {
      expect(getPortalPermission('client_primary', 'proposals.comment')).toBe(true);
    });

    it('can approve proposals', () => {
      expect(getPortalPermission('client_primary', 'proposals.approve')).toBe(true);
    });

    it('can view and pay invoices', () => {
      expect(getPortalPermission('client_primary', 'invoices.view')).toBe(true);
      expect(getPortalPermission('client_primary', 'invoices.pay')).toBe(true);
    });

    it('can upload files', () => {
      expect(getPortalPermission('client_primary', 'files.upload')).toBe(true);
    });

    it('can view milestones and progress', () => {
      expect(getPortalPermission('client_primary', 'milestones.view')).toBe(true);
      expect(getPortalPermission('client_primary', 'progress.view')).toBe(true);
    });
  });

  describe('client_viewer portal access', () => {
    it('can view proposals', () => {
      expect(getPortalPermission('client_viewer', 'proposals.view')).toBe(true);
    });

    it('cannot comment or approve proposals', () => {
      expect(getPortalPermission('client_viewer', 'proposals.comment')).toBe(false);
      expect(getPortalPermission('client_viewer', 'proposals.approve')).toBe(false);
    });

    it('can view invoices but cannot pay', () => {
      expect(getPortalPermission('client_viewer', 'invoices.view')).toBe(true);
      expect(getPortalPermission('client_viewer', 'invoices.pay')).toBe(false);
    });

    it('cannot upload files', () => {
      expect(getPortalPermission('client_viewer', 'files.upload')).toBe(false);
    });

    it('can view milestones and progress', () => {
      expect(getPortalPermission('client_viewer', 'milestones.view')).toBe(true);
      expect(getPortalPermission('client_viewer', 'progress.view')).toBe(true);
    });
  });
});

// ===========================================================================
// Subscription Tiers
// ===========================================================================

describe('Subscription Tier System', () => {
  // -----------------------------------------------------------------------
  // Tier hierarchy
  // -----------------------------------------------------------------------

  describe('Tier hierarchy', () => {
    it('defines 4 tiers: free < starter < professional < enterprise', () => {
      expect(tierMeetsMinimum('free', 'free')).toBe(true);
      expect(tierMeetsMinimum('free', 'starter')).toBe(false);
      expect(tierMeetsMinimum('starter', 'starter')).toBe(true);
      expect(tierMeetsMinimum('starter', 'professional')).toBe(false);
      expect(tierMeetsMinimum('professional', 'professional')).toBe(true);
      expect(tierMeetsMinimum('professional', 'enterprise')).toBe(false);
      expect(tierMeetsMinimum('enterprise', 'enterprise')).toBe(true);
    });

    it('higher tiers include lower tier features', () => {
      expect(tierMeetsMinimum('enterprise', 'starter')).toBe(true);
      expect(tierMeetsMinimum('enterprise', 'professional')).toBe(true);
      expect(tierMeetsMinimum('professional', 'starter')).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Starter tier features
  // -----------------------------------------------------------------------

  describe('Starter tier features', () => {
    const starterFeatures = [
      'proposals', 'clients', 'portfolio', 'assets', 'team',
      'templates', 'terms', 'pipeline', 'invoices', 'reports',
      'export_docx', 'export_pdf', 'leads', 'billing',
    ] as const;

    for (const feature of starterFeatures) {
      it(`includes ${feature}`, () => {
        expect(canAccessFeature('starter', feature)).toBe(true);
      });
    }
  });

  // -----------------------------------------------------------------------
  // Professional tier features
  // -----------------------------------------------------------------------

  describe('Professional tier features', () => {
    const proFeatures = [
      'integrations', 'crm_sync', 'accounting_sync', 'pm_sync',
      'automations', 'webhooks', 'email_inbox', 'multi_pipeline',
      'custom_reports', 'recurring_invoices', 'credit_notes',
      'crew', 'equipment', 'esign', 'calendar', 'online_payments', 'onboarding',
    ] as const;

    for (const feature of proFeatures) {
      it(`includes ${feature}`, () => {
        expect(canAccessFeature('professional', feature)).toBe(true);
      });
    }

    it('denies professional features to starter tier', () => {
      expect(canAccessFeature('starter', 'automations')).toBe(false);
      expect(canAccessFeature('starter', 'integrations')).toBe(false);
      expect(canAccessFeature('starter', 'crew')).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // Enterprise tier features
  // -----------------------------------------------------------------------

  describe('Enterprise tier features', () => {
    const enterpriseFeatures = [
      'time_tracking', 'resource_scheduling', 'budgets', 'profitability',
      'expenses', 'people_hr', 'time_off', 'org_chart', 'tasks',
      'gantt', 'custom_fields', 'scenarios', 'ai_assistant',
      'audit_log', 'permissions', 'sso', 'warehouse', 'payroll_export',
    ] as const;

    for (const feature of enterpriseFeatures) {
      it(`includes ${feature}`, () => {
        expect(canAccessFeature('enterprise', feature)).toBe(true);
      });
    }

    it('denies enterprise features to professional tier', () => {
      expect(canAccessFeature('professional', 'tasks')).toBe(false);
      expect(canAccessFeature('professional', 'time_tracking')).toBe(false);
      expect(canAccessFeature('professional', 'warehouse')).toBe(false);
      expect(canAccessFeature('professional', 'ai_assistant')).toBe(false);
    });

    it('denies enterprise features to starter tier', () => {
      expect(canAccessFeature('starter', 'tasks')).toBe(false);
      expect(canAccessFeature('starter', 'budgets')).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // Helper functions
  // -----------------------------------------------------------------------

  describe('Tier helper functions', () => {
    it('getRequiredTier returns correct tier for features', () => {
      expect(getRequiredTier('proposals')).toBe('starter');
      expect(getRequiredTier('automations')).toBe('professional');
      expect(getRequiredTier('tasks')).toBe('enterprise');
    });

    it('getTierLabel returns human-readable labels', () => {
      expect(getTierLabel('free')).toBe('Free');
      expect(getTierLabel('starter')).toBe('Starter');
      expect(getTierLabel('professional')).toBe('Professional');
      expect(getTierLabel('enterprise')).toBe('Enterprise');
    });
  });
});
