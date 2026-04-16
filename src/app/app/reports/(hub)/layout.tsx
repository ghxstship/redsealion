import { canView } from '@/lib/permissions/server';
import { AccessDenied } from '@/components/shared/AccessDenied';

export default async function ReportsHubLayout({ children }: { children: React.ReactNode }) {
  if (!(await canView('reports'))) return <AccessDenied />;
  return <>{children}</>;
}
