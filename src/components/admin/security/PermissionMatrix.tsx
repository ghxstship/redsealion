'use client';

const ROLES = ['org_admin', 'project_manager', 'designer', 'fabricator', 'installer'] as const;
const RESOURCES = ['proposals', 'invoices', 'clients', 'team', 'settings', 'budgets', 'time_tracking'] as const;
const ACTIONS = ['view', 'create', 'edit', 'delete'] as const;

// Default permission matrix
const defaults: Record<string, Record<string, boolean>> = {
  org_admin: Object.fromEntries(RESOURCES.flatMap((r) => ACTIONS.map((a) => [`${r}.${a}`, true]))),
  project_manager: {
    'proposals.view': true, 'proposals.create': true, 'proposals.edit': true, 'proposals.delete': false,
    'invoices.view': true, 'invoices.create': true, 'invoices.edit': true, 'invoices.delete': false,
    'clients.view': true, 'clients.create': true, 'clients.edit': true, 'clients.delete': false,
    'team.view': true, 'team.create': false, 'team.edit': false, 'team.delete': false,
    'settings.view': false, 'settings.create': false, 'settings.edit': false, 'settings.delete': false,
    'budgets.view': true, 'budgets.create': true, 'budgets.edit': true, 'budgets.delete': false,
    'time_tracking.view': true, 'time_tracking.create': true, 'time_tracking.edit': true, 'time_tracking.delete': false,
  },
  designer: {
    'proposals.view': true, 'proposals.create': false, 'proposals.edit': true, 'proposals.delete': false,
    'invoices.view': false, 'invoices.create': false, 'invoices.edit': false, 'invoices.delete': false,
    'clients.view': true, 'clients.create': false, 'clients.edit': false, 'clients.delete': false,
    'team.view': true, 'team.create': false, 'team.edit': false, 'team.delete': false,
    'settings.view': false, 'settings.create': false, 'settings.edit': false, 'settings.delete': false,
    'budgets.view': false, 'budgets.create': false, 'budgets.edit': false, 'budgets.delete': false,
    'time_tracking.view': true, 'time_tracking.create': true, 'time_tracking.edit': true, 'time_tracking.delete': false,
  },
  fabricator: {
    'proposals.view': true, 'proposals.create': false, 'proposals.edit': false, 'proposals.delete': false,
    'invoices.view': false, 'invoices.create': false, 'invoices.edit': false, 'invoices.delete': false,
    'clients.view': false, 'clients.create': false, 'clients.edit': false, 'clients.delete': false,
    'team.view': true, 'team.create': false, 'team.edit': false, 'team.delete': false,
    'settings.view': false, 'settings.create': false, 'settings.edit': false, 'settings.delete': false,
    'budgets.view': false, 'budgets.create': false, 'budgets.edit': false, 'budgets.delete': false,
    'time_tracking.view': true, 'time_tracking.create': true, 'time_tracking.edit': true, 'time_tracking.delete': false,
  },
  installer: {
    'proposals.view': true, 'proposals.create': false, 'proposals.edit': false, 'proposals.delete': false,
    'invoices.view': false, 'invoices.create': false, 'invoices.edit': false, 'invoices.delete': false,
    'clients.view': false, 'clients.create': false, 'clients.edit': false, 'clients.delete': false,
    'team.view': true, 'team.create': false, 'team.edit': false, 'team.delete': false,
    'settings.view': false, 'settings.create': false, 'settings.edit': false, 'settings.delete': false,
    'budgets.view': false, 'budgets.create': false, 'budgets.edit': false, 'budgets.delete': false,
    'time_tracking.view': true, 'time_tracking.create': true, 'time_tracking.edit': true, 'time_tracking.delete': false,
  },
};

export default function PermissionMatrix() {
  return (
    <div className="space-y-6">
      {ROLES.map((role) => (
        <div key={role} className="rounded-xl border border-border bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-bg-secondary">
            <h3 className="text-sm font-semibold text-foreground capitalize">
              {role.replace(/_/g, ' ')}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-2 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Resource</th>
                  {ACTIONS.map((action) => (
                    <th key={action} className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-text-muted">
                      {action}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {RESOURCES.map((resource) => (
                  <tr key={resource} className="hover:bg-bg-secondary/50 transition-colors">
                    <td className="px-6 py-2.5 text-sm text-foreground capitalize">
                      {resource.replace(/_/g, ' ')}
                    </td>
                    {ACTIONS.map((action) => {
                      const key = `${resource}.${action}`;
                      const allowed = defaults[role]?.[key] ?? false;
                      return (
                        <td key={action} className="px-4 py-2.5 text-center">
                          <div
                            className={`mx-auto h-4 w-4 rounded ${
                              allowed ? 'bg-green-500' : 'bg-gray-200'
                            }`}
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
      ))}
    </div>
  );
}
