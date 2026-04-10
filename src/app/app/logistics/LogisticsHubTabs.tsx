'use client';

import { useRouter, usePathname } from 'next/navigation';
import Tabs from '@/components/ui/Tabs';

type LogisticsTab = 'inventory' | 'shipping' | 'receiving' | 'transfers' | 'packing' | 'counts' | 'scan' | 'goods-receipts';

const TABS: Array<{ key: LogisticsTab; label: string }> = [
  { key: 'inventory', label: 'Inventory' },
  { key: 'shipping', label: 'Shipping' },
  { key: 'receiving', label: 'Receiving' },
  { key: 'goods-receipts', label: 'Goods Receipts' },
  { key: 'transfers', label: 'Transfers' },
  { key: 'packing', label: 'Packing Lists' },
  { key: 'counts', label: 'Counts' },
  { key: 'scan', label: 'Scan' },
];

const TAB_ROUTES: Record<LogisticsTab, string> = {
  inventory: '/app/logistics',
  shipping: '/app/logistics/shipping',
  receiving: '/app/logistics/receiving',
  'goods-receipts': '/app/logistics/goods-receipts',
  transfers: '/app/logistics/transfers',
  packing: '/app/logistics/packing',
  counts: '/app/logistics/counts',
  scan: '/app/logistics/scan',
};

function getActiveTab(pathname: string): LogisticsTab {
  if (pathname.includes('/shipping')) return 'shipping';
  if (pathname.includes('/receiving')) return 'receiving';
  if (pathname.includes('/goods-receipts')) return 'goods-receipts';
  if (pathname.includes('/transfers')) return 'transfers';
  if (pathname.includes('/packing')) return 'packing';
  if (pathname.includes('/counts')) return 'counts';
  if (pathname.includes('/scan')) return 'scan';
  return 'inventory';
}

export default function LogisticsHubTabs() {
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
