import { canView } from '@/lib/permissions/server';
import { AccessDenied } from '@/components/shared/AccessDenied';

export default async function InvoiceHubLayout({ children }: { children: React.ReactNode }) {
  if (!(await canView('invoices'))) return <AccessDenied />;
  return <>{children}</>;
}
