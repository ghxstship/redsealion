'use client';

import { useRouter, usePathname } from 'next/navigation';
import Tabs from '@/components/ui/Tabs';

type WarehouseTab = 'inventory' | 'transfers' | 'packing' | 'counts' | 'scan';

const TABS: Array<{ key: WarehouseTab; label: string }> = [
  { key: 'inventory', label: 'Inventory' },
  { key: 'transfers', label: 'Transfers' },
  { key: 'packing', label: 'Packing Lists' },
  { key: 'counts', label: 'Counts' },
  { key: 'scan', label: 'Scan' },
];

const TAB_ROUTES: Record<WarehouseTab, string> = {
  inventory: '/app/warehouse',
  transfers: '/app/warehouse/transfers',
  packing: '/app/warehouse/packing',
  counts: '/app/warehouse/counts',
  scan: '/app/warehouse/scan',
};

function getActiveTab(pathname: string): WarehouseTab {
  if (pathname.includes('/transfers')) return 'transfers';
  if (pathname.includes('/packing')) return 'packing';
  if (pathname.includes('/counts')) return 'counts';
  if (pathname.includes('/scan')) return 'scan';
  return 'inventory';
}

export default function WarehouseHubTabs() {
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
