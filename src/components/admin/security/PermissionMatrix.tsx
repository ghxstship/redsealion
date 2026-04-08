'use client';

import { useState, useCallback } from 'react';
import Alert from '@/components/ui/Alert';
import { createClient } from '@/lib/supabase/client';
import { useSubscription } from '@/components/shared/SubscriptionProvider';
import type { OrganizationRole } from '@/types/database';
import {
  ALL_RESOURCES,
  ALL_ACTIONS,
  INTERNAL_ROLES,
  DEFAULT_PERMISSIONS,
  permKey,
  type PermissionResource,
  type PermissionAction,
} from '@/lib/permissions';

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
};

const ROLE_LABELS: Record<string, string> = {
  developer: 'Developer',
  owner: 'Owner',
  admin: 'Admin',
  controller: 'Controller',
  manager: 'Manager',
  team_member: 'Team Member',
};

export default function PermissionMatrix({ organizationId, overrides }: PermissionMatrixProps) {
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
    async (role: OrganizationRole, resource: PermissionResource, action: PermissionAction) => {
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
    [isEnterprise, organizationId, permissions],
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
          <div key={role} className="rounded-xl border border-border bg-white overflow-hidden">
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
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-6 py-2 text-left text-xs font-medium uppercase tracking-wider text-text-muted w-48">
                      Resource
                    </th>
                    {ALL_ACTIONS.map((action) => (
                      <th
                        key={action}
                        className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-text-muted"
                      >
                        {action}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {ALL_RESOURCES.map((resource) => (
                    <tr key={resource} className="hover:bg-bg-secondary/50 transition-colors">
                      <td className="px-6 py-2.5 text-sm text-foreground">
                        {RESOURCE_LABELS[resource]}
                      </td>
                      {ALL_ACTIONS.map((action) => {
                        const key = permKey(resource, action);
                        const allowed = permissions[role]?.[key] ?? false;
                        const isSaving = saving === `${role}.${key}`;
                        const editable = isEnterprise && !isAdmin;

                        return (
                          <td key={action} className="px-4 py-2.5 text-center">
                            <button
                              type="button"
                              disabled={!editable || isSaving}
                              onClick={() => togglePermission(role, resource, action)}
                              className={`mx-auto h-5 w-5 rounded transition-colors ${
                                editable ? 'cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-gray-300' : 'cursor-default'
                              } ${
                                allowed ? 'bg-green-500' : 'bg-gray-200'
                              } ${isSaving ? 'opacity-50 animate-pulse' : ''}`}
                              title={`${allowed ? 'Allowed' : 'Denied'}: ${ROLE_LABELS[role] ?? role} → ${action} ${resource}`}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
