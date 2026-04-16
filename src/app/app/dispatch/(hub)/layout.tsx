import { canView } from '@/lib/permissions/server';
import { AccessDenied } from '@/components/shared/AccessDenied';

export default async function DispatchHubLayout({ children }: { children: React.ReactNode }) {
  if (!(await canView('dispatch'))) return <AccessDenied />;
  return <>{children}</>;
}
