'use client';

import { useRouter, usePathname } from 'next/navigation';
import Tabs from '@/components/ui/Tabs';

type FinanceTab = 'overview' | 'invoices' | 'purchase-orders' | 'vendors' | 'revenue-recognition' | 'profitability' | 'budgets';

const TABS: Array<{ key: FinanceTab; label: string }> = [
  { key: 'overview', label: 'Overview' },
  { key: 'invoices', label: 'Invoices' },
  { key: 'purchase-orders', label: 'Purchase Orders' },
  { key: 'vendors', label: 'Vendors' },
  { key: 'revenue-recognition', label: 'Revenue Recognition' },
  { key: 'profitability', label: 'Profitability' },
  { key: 'budgets', label: 'Budgets' },
];

const TAB_ROUTES: Record<FinanceTab, string> = {
  overview: '/app/finance',
  invoices: '/app/finance/invoices',
  'purchase-orders': '/app/finance/purchase-orders',
  vendors: '/app/finance/vendors',
  'revenue-recognition': '/app/finance/revenue-recognition',
  profitability: '/app/finance/profitability',
  budgets: '/app/finance/budgets',
};

function getActiveTab(pathname: string): FinanceTab {
  if (pathname.includes('/invoices')) return 'invoices';
  if (pathname.includes('/purchase-orders')) return 'purchase-orders';
  if (pathname.includes('/vendors')) return 'vendors';
  if (pathname.includes('/revenue-recognition')) return 'revenue-recognition';
  if (pathname.includes('/profitability')) return 'profitability';
  if (pathname.includes('/budgets')) return 'budgets';
  return 'overview';
}

export default function FinanceHubTabs() {
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
