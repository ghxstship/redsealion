import { canView } from '@/lib/permissions/server';
import { AccessDenied } from '@/components/shared/AccessDenied';

export default async function EventsHubLayout({ children }: { children: React.ReactNode }) {
  if (!(await canView('events'))) return <AccessDenied />;
  return <>{children}</>;
}
