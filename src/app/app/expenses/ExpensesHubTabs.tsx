'use client';

import { useRouter, usePathname } from 'next/navigation';
import Tabs from '@/components/ui/Tabs';

type ExpensesTab = 'expenses' | 'approvals' | 'receipts' | 'mileage';

const TABS: Array<{ key: ExpensesTab; label: string }> = [
  { key: 'expenses', label: 'Expenses' },
  { key: 'approvals', label: 'Approvals' },
  { key: 'receipts', label: 'Receipts' },
  { key: 'mileage', label: 'Mileage' },
];

const TAB_ROUTES: Record<ExpensesTab, string> = {
  expenses: '/app/expenses',
  approvals: '/app/expenses/approvals',
  receipts: '/app/expenses/receipts',
  mileage: '/app/expenses/mileage',
};

function getActiveTab(pathname: string): ExpensesTab {
  if (pathname.includes('/approvals')) return 'approvals';
  if (pathname.includes('/receipts')) return 'receipts';
  if (pathname.includes('/mileage')) return 'mileage';
  return 'expenses';
}

export default function ExpensesHubTabs() {
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
