import { TierGate } from '@/components/shared/TierGate';
import PermissionMatrix from '@/components/admin/security/PermissionMatrix';

export default function PermissionsPage() {
  return (
    <TierGate feature="permissions">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Permissions
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Configure role-based access controls.
        </p>
      </div>

      <PermissionMatrix />
    </TierGate>
  );
}
