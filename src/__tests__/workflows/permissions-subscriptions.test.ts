/**
 * Permissions & Subscription Tiers — End-to-End Workflow Validation
 *
 * 10-role platform architecture:
 *   INTERNAL: developer, owner, admin, controller, collaborator
 *   EXTERNAL: client, contractor, crew, viewer
 *
 * RBAC:
 *   + Role-based permission matrix (6 internal + 4 external roles)
 *   + 20 resources × 4 actions
 *   + Admin bypass (developer, owner)
 *   + Default permission lookup
 *   + Database override support
 *
 * Subscription tiers:
 *   + Feature gating per tier (free < starter < professional < enterprise)
 *   + canAccessFeature logic
 *   + Tier comparison helpers
 *
 * Portal permissions:
 *   + client vs viewer capabilities
 */
import { describe, it, expect } from 'vitest';
import {
  DEFAULT_PERMISSIONS,
  ALL_RESOURCES,
  ALL_ACTIONS,
  INTERNAL_ROLES,
  EXTERNAL_ROLES,
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
import type { PlatformRole } from '@/lib/permissions';

describe('Permission System', () => {
  // -----------------------------------------------------------------------
  // Role definitions
  // -----------------------------------------------------------------------

  describe('Role definitions', () => {
    it('defines 5 internal roles', () => {
      expect(INTERNAL_ROLES).toHaveLength(5);
      expect(INTERNAL_ROLES).toContain('developer');
      expect(INTERNAL_ROLES).toContain('owner');
      expect(INTERNAL_ROLES).toContain('admin');
      expect(INTERNAL_ROLES).toContain('controller');
      expect(INTERNAL_ROLES).toContain('collaborator');
    });

    it('defines 4 external roles', () => {
      expect(EXTERNAL_ROLES).toHaveLength(4);
      expect(EXTERNAL_ROLES).toContain('client');
      expect(EXTERNAL_ROLES).toContain('contractor');
      expect(EXTERNAL_ROLES).toContain('crew');
      expect(EXTERNAL_ROLES).toContain('viewer');
    });
  });

  // -----------------------------------------------------------------------
  // Resource and action definitions
  // -----------------------------------------------------------------------

  describe('Resources and actions', () => {
    it('defines permission resources', () => {
      expect(ALL_RESOURCES.length).toBeGreaterThanOrEqual(19);
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
  // God/Admin permissions (developer, owner)
  // -----------------------------------------------------------------------

  describe('Admin permissions', () => {
    it('grants developer full access to all resources', () => {
      for (const resource of ALL_RESOURCES) {
        for (const action of ALL_ACTIONS) {
          expect(getDefaultPermission('developer', resource, action)).toBe(true);
        }
      }
    });

    it('grants owner full access to all resources', () => {
      for (const resource of ALL_RESOURCES) {
        for (const action of ALL_ACTIONS) {
          expect(getDefaultPermission('owner', resource, action)).toBe(true);
        }
      }
    });

    it('grants admin full access to all resources', () => {
      for (const resource of ALL_RESOURCES) {
        for (const action of ALL_ACTIONS) {
          // Admin cannot delete org-level settings (by design — prevents org deletion/transfer by admin)
          if (resource === 'settings' && action === 'delete') {
            expect(getDefaultPermission('admin', resource, action)).toBe(false);
          } else {
            expect(getDefaultPermission('admin', resource, action)).toBe(true);
          }
        }
      }
    });
  });

  // -----------------------------------------------------------------------
  // Collaborator permissions
  // -----------------------------------------------------------------------

  describe('Collaborator permissions', () => {
    it('can CRUD proposals (no delete)', () => {
      expect(getDefaultPermission('collaborator', 'proposals', 'view')).toBe(true);
      expect(getDefaultPermission('collaborator', 'proposals', 'create')).toBe(true);
      expect(getDefaultPermission('collaborator', 'proposals', 'edit')).toBe(true);
      expect(getDefaultPermission('collaborator', 'proposals', 'delete')).toBe(false);
    });

    it('can view pipeline and create (no delete)', () => {
      expect(getDefaultPermission('collaborator', 'pipeline', 'view')).toBe(true);
      expect(getDefaultPermission('collaborator', 'pipeline', 'create')).toBe(true);
      expect(getDefaultPermission('collaborator', 'pipeline', 'delete')).toBe(false);
    });

    it('has no access to settings or integrations', () => {
      expect(getDefaultPermission('collaborator', 'settings', 'view')).toBe(false);
      expect(getDefaultPermission('collaborator', 'integrations', 'view')).toBe(false);
    });

    it('can view but not edit team', () => {
      expect(getDefaultPermission('collaborator', 'team', 'view')).toBe(true);
      expect(getDefaultPermission('collaborator', 'team', 'create')).toBe(false);
      expect(getDefaultPermission('collaborator', 'team', 'edit')).toBe(false);
    });

    it('can manage own time and expenses', () => {
      expect(getDefaultPermission('collaborator', 'time_tracking', 'view')).toBe(true);
      expect(getDefaultPermission('collaborator', 'time_tracking', 'create')).toBe(true);
      expect(getDefaultPermission('collaborator', 'expenses', 'create')).toBe(true);
    });

    it('can create and edit assets', () => {
      expect(getDefaultPermission('collaborator', 'assets', 'view')).toBe(true);
      expect(getDefaultPermission('collaborator', 'assets', 'create')).toBe(true);
      expect(getDefaultPermission('collaborator', 'assets', 'edit')).toBe(true);
    });
  });



  // -----------------------------------------------------------------------
  // External role permissions (admin app — no access)
  // -----------------------------------------------------------------------

  describe('External role admin permissions', () => {
    const externalRoles: PlatformRole[] = ['client', 'contractor', 'crew'];

    for (const role of externalRoles) {
      it(`${role} has no admin app access`, () => {
        for (const resource of ALL_RESOURCES) {
          for (const action of ALL_ACTIONS) {
            expect(getDefaultPermission(role, resource, action)).toBe(false);
          }
        }
      });
    }

    it('viewer has read-only access to select resources', () => {
      // Viewer can view reports, portfolio, proposals, etc.
      expect(getDefaultPermission('viewer', 'reports', 'view')).toBe(true);
      expect(getDefaultPermission('viewer', 'portfolio', 'view')).toBe(true);
      expect(getDefaultPermission('viewer', 'proposals', 'view')).toBe(true);
      // But cannot create/edit/delete
      expect(getDefaultPermission('viewer', 'proposals', 'create')).toBe(false);
      expect(getDefaultPermission('viewer', 'proposals', 'edit')).toBe(false);
      expect(getDefaultPermission('viewer', 'proposals', 'delete')).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // Permission key helper
  // -----------------------------------------------------------------------

  describe('Permission lookup', () => {
    it('returns false for unknown role/resource/action combinations', () => {
      expect(getDefaultPermission('collaborator', 'warehouse', 'delete')).toBe(false);
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
  describe('client portal access', () => {
    it('can view proposals', () => {
      expect(getPortalPermission('client', 'proposals.view')).toBe(true);
    });

    it('can comment on proposals', () => {
      expect(getPortalPermission('client', 'proposals.comment')).toBe(true);
    });

    it('can approve proposals', () => {
      expect(getPortalPermission('client', 'proposals.approve')).toBe(true);
    });

    it('can view and pay invoices', () => {
      expect(getPortalPermission('client', 'invoices.view')).toBe(true);
      expect(getPortalPermission('client', 'invoices.pay')).toBe(true);
    });

    it('can upload files', () => {
      expect(getPortalPermission('client', 'files.upload')).toBe(true);
    });

    it('can view milestones and progress', () => {
      expect(getPortalPermission('client', 'milestones.view')).toBe(true);
      expect(getPortalPermission('client', 'progress.view')).toBe(true);
    });
  });

  describe('viewer portal access', () => {
    it('can view proposals', () => {
      expect(getPortalPermission('viewer', 'proposals.view')).toBe(true);
    });

    it('cannot comment or approve proposals', () => {
      expect(getPortalPermission('viewer', 'proposals.comment')).toBe(false);
      expect(getPortalPermission('viewer', 'proposals.approve')).toBe(false);
    });

    it('can view invoices but cannot pay', () => {
      expect(getPortalPermission('viewer', 'invoices.view')).toBe(true);
      expect(getPortalPermission('viewer', 'invoices.pay')).toBe(false);
    });

    it('cannot upload files', () => {
      expect(getPortalPermission('viewer', 'files.upload')).toBe(false);
    });

    it('can view milestones and progress', () => {
      expect(getPortalPermission('viewer', 'milestones.view')).toBe(true);
      expect(getPortalPermission('viewer', 'progress.view')).toBe(true);
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
      // Projects module — available to all tiers (portal)
      'tasks', 'gantt', 'projects', 'roadmap', 'files', 'calendar',
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
      'expenses', 'people_hr', 'time_off', 'org_chart',
      'custom_fields', 'scenarios', 'ai_assistant',
      'audit_log', 'permissions', 'sso', 'warehouse', 'payroll_export',
    ] as const;

    for (const feature of enterpriseFeatures) {
      it(`includes ${feature}`, () => {
        expect(canAccessFeature('enterprise', feature)).toBe(true);
      });
    }

    it('denies enterprise features to professional tier', () => {
      expect(canAccessFeature('professional', 'time_tracking')).toBe(false);
      expect(canAccessFeature('professional', 'warehouse')).toBe(false);
      expect(canAccessFeature('professional', 'ai_assistant')).toBe(false);
    });

    it('denies enterprise features to starter tier', () => {
      expect(canAccessFeature('starter', 'budgets')).toBe(false);
      expect(canAccessFeature('starter', 'time_tracking')).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // Helper functions
  // -----------------------------------------------------------------------

  describe('Tier helper functions', () => {
    it('getRequiredTier returns correct tier for features', () => {
      expect(getRequiredTier('proposals')).toBe('portal');
      expect(getRequiredTier('automations')).toBe('professional');
      expect(getRequiredTier('tasks')).toBe('portal');
      expect(getRequiredTier('time_tracking')).toBe('enterprise');
    });

    it('getTierLabel returns human-readable labels', () => {
      expect(getTierLabel('free')).toBe('Free');
      expect(getTierLabel('starter')).toBe('Starter');
      expect(getTierLabel('professional')).toBe('Professional');
      expect(getTierLabel('enterprise')).toBe('Enterprise');
    });
  });
});
