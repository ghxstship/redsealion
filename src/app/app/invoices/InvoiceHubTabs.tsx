'use client';

import { useRouter, usePathname } from 'next/navigation';
import Tabs from '@/components/ui/Tabs';

type InvoiceHubTab = 'invoices' | 'credit-notes' | 'recurring';

const TABS: Array<{ key: InvoiceHubTab; label: string }> = [
  { key: 'invoices', label: 'Invoices' },
  { key: 'credit-notes', label: 'Credit Notes' },
  { key: 'recurring', label: 'Recurring' },
];

const TAB_ROUTES: Record<InvoiceHubTab, string> = {
  invoices: '/app/invoices',
  'credit-notes': '/app/invoices/credit-notes',
  recurring: '/app/invoices/recurring',
};

function getActiveTab(pathname: string): InvoiceHubTab {
  if (pathname.includes('/credit-notes')) return 'credit-notes';
  if (pathname.includes('/recurring')) return 'recurring';
  return 'invoices';
}

export default function InvoiceHubTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const activeTab = getActiveTab(pathname);

  return (
    <Tabs
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={(key) => router.push(TAB_ROUTES[key])}
      className="mb-8"
    />
  );
}
