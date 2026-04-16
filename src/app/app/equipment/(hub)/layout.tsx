import { canView } from '@/lib/permissions/server';
import { AccessDenied } from '@/components/shared/AccessDenied';

export default async function EquipmentHubLayout({ children }: { children: React.ReactNode }) {
  if (!(await canView('equipment'))) return <AccessDenied />;
  return <>{children}</>;
}
