import { getSessionRole } from '@/lib/permissions/server';
import { AccessDenied } from '@/components/shared/AccessDenied';
import type { PlatformRole } from '@/lib/permissions';
import SettingsNav from './SettingsNav';

const ALLOWED: PlatformRole[] = ['developer', 'owner', 'admin', 'controller', 'collaborator'];

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const role = await getSessionRole();
  if (!ALLOWED.includes(role)) return <AccessDenied role={role} />;
  return <SettingsNav>{children}</SettingsNav>;
}
