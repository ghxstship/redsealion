import { canView } from '@/lib/permissions/server';
import { AccessDenied } from '@/components/shared/AccessDenied';

export default async function FabricationHubLayout({ children }: { children: React.ReactNode }) {
  if (!(await canView('fabrication'))) return <AccessDenied />;
  return <>{children}</>;
}
