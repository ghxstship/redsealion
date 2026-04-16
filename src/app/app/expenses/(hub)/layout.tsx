import { canView } from '@/lib/permissions/server';
import { AccessDenied } from '@/components/shared/AccessDenied';

export default async function ExpensesHubLayout({ children }: { children: React.ReactNode }) {
  if (!(await canView('expenses'))) return <AccessDenied />;
  return <>{children}</>;
}
