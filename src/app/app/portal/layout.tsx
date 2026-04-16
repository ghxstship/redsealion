import { canView } from '@/lib/permissions/server';
import { AccessDenied } from '@/components/shared/AccessDenied';

export default async function PortalPreviewLayout({ children }: { children: React.ReactNode }) {
  if (!(await canView('portals'))) return <AccessDenied />;
  return <>{children}</>;
}
