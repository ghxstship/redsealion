import { getSessionRole } from '@/lib/permissions/server';
import { AccessDenied } from '@/components/shared/AccessDenied';
import type { PlatformRole } from '@/lib/permissions';

const ALLOWED: PlatformRole[] = ['developer', 'owner', 'admin', 'collaborator'];

export default async function CampaignsHubLayout({ children }: { children: React.ReactNode }) {
  const role = await getSessionRole();
  if (!ALLOWED.includes(role)) return <AccessDenied role={role} />;
  return <>{children}</>;
}
