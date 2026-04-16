import { Lock } from 'lucide-react';

/**
 * AccessDenied — Server-compatible access denial UI.
 *
 * Renders in the initial HTML response — no client hydration required.
 * Used by server-component layouts for route-level RBAC gating.
 *
 * Includes `data-testid="access-denied"` for reliable E2E detection.
 */
export function AccessDenied({ role }: { role?: string }) {
  return (
    <div
      data-testid="access-denied"
      className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center"
    >
      <Lock size={40} className="text-text-muted" />
      <h2 className="text-lg font-semibold text-foreground">Access Denied</h2>
      <p className="text-sm text-text-muted max-w-md">
        {role
          ? `Your role (${role}) does not have permission to view this section.`
          : 'You do not have permission to view this section.'}
      </p>
    </div>
  );
}
