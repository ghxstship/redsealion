import { canView } from '@/lib/permissions/server';
import { AccessDenied } from '@/components/shared/AccessDenied';

export default async function PipelineHubLayout({ children }: { children: React.ReactNode }) {
  if (!(await canView('pipeline'))) return <AccessDenied />;
  return <>{children}</>;
}
