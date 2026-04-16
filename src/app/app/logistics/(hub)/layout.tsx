import { canView } from '@/lib/permissions/server';
import { AccessDenied } from '@/components/shared/AccessDenied';

export default async function LogisticsHubLayout({ children }: { children: React.ReactNode }) {
  if (!(await canView('warehouse'))) return <AccessDenied />;
  return <>{children}</>;
}
