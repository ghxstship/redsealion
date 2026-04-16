import { canView } from '@/lib/permissions/server';
import { AccessDenied } from '@/components/shared/AccessDenied';

export default async function ManifestLayout({ children }: { children: React.ReactNode }) {
  if (!(await canView('manifest'))) return <AccessDenied />;
  return <>{children}</>;
}
