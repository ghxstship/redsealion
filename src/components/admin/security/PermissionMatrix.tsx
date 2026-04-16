'use client';
import Button from '@/components/ui/Button';

import { useState, useCallback } from 'react';
import Alert from '@/components/ui/Alert';
import { createClient } from '@/lib/supabase/client';
import { useSubscription } from '@/components/shared/SubscriptionProvider';
import type { PlatformRole } from '@/lib/permissions';
import {
  ALL_RESOURCES,
  ALL_ACTIONS,
  INTERNAL_ROLES,
  DEFAULT_PERMISSIONS,
  permKey,
  type PermissionResource,
  type PermissionAction,
} from '@/lib/permissions';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { ROLE_LABELS } from '@/config/roles';

interface PermissionMatrixProps {
  organizationId: string;
  overrides: Array<{
    role: string;
    resource: string;
    action: string;
    allowed: boolean;
  }>;
}

const RESOURCE_LABELS: Record<PermissionResource, string> = {
  proposals: 'Proposals',
  pipeline: 'Pipeline / Deals',
  clients: 'Clients',
  invoices: 'Invoices',
  expenses: 'Expenses',
  budgets: 'Budgets',
  time_tracking: 'Time Tracking',
  tasks: 'Tasks',
  reports: 'Reports',
  assets: 'Assets',
  team: 'Team / People',
  integrations: 'Integrations',
  automations: 'Automations',
  settings: 'Settings',
  ai_assistant: 'AI Assistant',
  crew: 'Crew',
  equipment: 'Equipment',
  leads: 'Leads',
  warehouse: 'Warehouse',
  advances: 'Advances',
  activations: 'Activations',
  events: 'Events',
  locations: 'Locations',
  work_orders: 'Work Orders',
  resources: 'Resources',
  resource_scheduling: 'Resource Scheduling',
  ai_drafting: 'AI Drafting',
  email_campaigns: 'Email Campaigns',
  referral_program: 'Referral Program',
  purchase_orders: 'Purchase Orders',
  vendors: 'Vendors',
  dispatch: 'Dispatch',
  fabrication: 'Fabrication',
  rentals: 'Rentals',
  projects: 'Projects',
  goals: 'Goals',
  portfolio: 'Portfolio',
  compliance: 'Compliance',
  marketplace: 'Marketplace',
  files: 'Files',
  project_portals: 'Project Portals',
  webhooks: 'Webhooks',
  schedule: 'Schedule',
  portals: 'Portals',
  profitability: 'Profitability',
  templates: 'Templates',
  terms: 'Terms',
  workloads: 'Workloads',
  roadmap: 'Roadmap',
  finance: 'Finance',
  calendar: 'Calendar',
  campaigns: 'Campaigns',
  email_inbox: 'Email Inbox',
  spaces: 'Spaces',
  zones: 'Zones',
  components: 'Components',
  component_items: 'Component Items',
  hierarchy_tasks: 'Hierarchy Tasks',
  manifest: 'Manifest',
};

export default function PermissionMatrix({ organizationId: _organizationId, overrides }: PermissionMatrixProps) {
  const { tier } = useSubscription();
  const isEnterprise = tier === 'enterprise';

  // Build effective permission state: defaults merged with DB overrides
  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>(() => {
    const state: Record<string, Record<string, boolean>> = {};
    for (const role of INTERNAL_ROLES) {
      state[role] = { ...DEFAULT_PERMISSIONS[role] };
    }
    // Apply DB overrides
    for (const o of overrides) {
      const key = permKey(o.resource as PermissionResource, o.action as PermissionAction);
      if (state[o.role]) {
        state[o.role][key] = o.allowed;
      }
    }
    return state;
  });

  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const togglePermission = useCallback(
    async (role: PlatformRole, resource: PermissionResource, action: PermissionAction) => {
      if (!isEnterprise) return;
      // developer and owner are always full access — not editable
      if (role === 'developer' || role === 'owner') return;

      const key = permKey(resource, action);
      const current = permissions[role]?.[key] ?? false;
      const newValue = !current;

      // Optimistic update
      setPermissions((prev) => ({
        ...prev,
        [role]: { ...prev[role], [key]: newValue },
      }));

      const saveKey = `${role}.${key}`;
      setSaving(saveKey);
      setError(null);

      try {
        const supabase = createClient();
        // Look up the permission catalog entry for this resource+action
        const { data: catalogEntry } = await supabase
          .from('permission_catalog')
          .select('id')
          .eq('resource', resource)
          .eq('action', action)
          .single();

        if (!catalogEntry) {
          setError('Permission not found in catalog.');
          setPermissions((prev) => ({
            ...prev,
            [role]: { ...prev[role], [key]: current },
          }));
          return;
        }

        // Look up the role ID
        const { data: roleEntry } = await supabase
          .from('roles')
          .select('id')
          .eq('name', role)
          .single();

        if (!roleEntry) {
          setError('Role not found.');
          setPermissions((prev) => ({
            ...prev,
            [role]: { ...prev[role], [key]: current },
          }));
          return;
        }

        const { error: upsertError } = await supabase
          .from('role_permissions')
          .upsert(
            {
              role_id: roleEntry.id,
              permission_id: catalogEntry.id,
              granted: newValue,
            },
            { onConflict: 'role_id,permission_id' },
          );

        if (upsertError) {
          // Revert
          setPermissions((prev) => ({
            ...prev,
            [role]: { ...prev[role], [key]: current },
          }));
          setError(upsertError.message);
        }
      } catch {
        setPermissions((prev) => ({
          ...prev,
          [role]: { ...prev[role], [key]: current },
        }));
        setError('Failed to save permission.');
      } finally {
        setSaving(null);
      }
    },
    [isEnterprise, permissions],
  );

  return (
    <div className="space-y-6">
      {error && (
        <Alert className="mb-4">{error}</Alert>
      )}

      {!isEnterprise && (
        <Alert variant="warning">
          Upgrade to Enterprise to customize role permissions. The default matrix is shown below.
        </Alert>
      )}

      {INTERNAL_ROLES.map((role) => {
        const isAdmin = role === 'developer' || role === 'owner';

        return (
          <div key={role} className="rounded-xl border border-border bg-background overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-bg-secondary flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                {ROLE_LABELS[role] ?? role}
              </h3>
              {isAdmin && (
                <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted bg-bg-tertiary rounded px-2 py-0.5">
                  Full Access
                </span>
              )}
            </div>
            <div className="overflow-x-auto">
              <Table >
                <TableHeader>
                  <TableRow className="border-b border-border">
                    <TableHead className="px-6 py-2 text-left text-xs font-medium uppercase tracking-wider text-text-muted w-48">
                      Resource
                    </TableHead>
                    {ALL_ACTIONS.map((action) => (
                      <TableHead
                        key={action}
                        className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-text-muted"
                      >
                        {action}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody >
                  {ALL_RESOURCES.map((resource) => (
                    <TableRow key={resource} className="hover:bg-bg-secondary/50 transition-colors">
                      <TableCell className="px-6 py-2.5 text-sm text-foreground">
                        {RESOURCE_LABELS[resource]}
                      </TableCell>
                      {ALL_ACTIONS.map((action) => {
                        const key = permKey(resource, action);
                        const allowed = permissions[role]?.[key] ?? false;
                        const isSaving = saving === `${role}.${key}`;
                        const editable = isEnterprise && !isAdmin;

                        return (
                          <TableCell key={action} className="px-4 py-2.5 text-center">
                            <Button variant="ghost"
                              type="button"
                              disabled={!editable || isSaving}
                              onClick={() => togglePermission(role, resource, action)}
                              className={`mx-auto h-5 w-5 rounded transition-colors ${
                                editable ? 'cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-gray-300' : 'cursor-default'
                              } ${
                                allowed ? 'bg-green-500' : 'bg-bg-tertiary'
                              } ${isSaving ? 'opacity-50 animate-pulse' : ''}`}
                              title={`${allowed ? 'Allowed' : 'Denied'}: ${ROLE_LABELS[role] ?? role} → ${action} ${resource}`}
                            >
                              <span className="sr-only">Toggle</span>
                            </Button>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
