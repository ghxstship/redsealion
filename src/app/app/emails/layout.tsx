import { canView } from '@/lib/permissions/server';
import { AccessDenied } from '@/components/shared/AccessDenied';

export default async function Layout({ children }: { children: React.ReactNode }) {
  if (!(await canView('email_inbox'))) return <AccessDenied />;
  return <>{children}</>;
}
