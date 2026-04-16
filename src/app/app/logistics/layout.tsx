import { canView } from '@/lib/permissions/server';
import { AccessDenied } from '@/components/shared/AccessDenied';
import { TierGate } from '@/components/shared/TierGate';

export default async function LogisticsModuleLayout({ children }: { children: React.ReactNode }) {
  if (!(await canView('warehouse'))) return <AccessDenied />;
  return (
    <TierGate feature="warehouse">
      {children}
    </TierGate>
  );
}
