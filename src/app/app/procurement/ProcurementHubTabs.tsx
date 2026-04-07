'use client';

import { useRouter, usePathname } from 'next/navigation';
import Tabs from '@/components/ui/Tabs';

type ProcurementTab = 'overview' | 'requisitions' | 'purchase-orders' | 'receiving' | 'suppliers';

const TABS: Array<{ key: ProcurementTab; label: string }> = [
  { key: 'overview', label: 'Overview' },
  { key: 'requisitions', label: 'Requisitions' },
  { key: 'purchase-orders', label: 'Purchase Orders' },
  { key: 'receiving', label: 'Receiving' },
  { key: 'suppliers', label: 'Suppliers' },
];

const TAB_ROUTES: Record<ProcurementTab, string> = {
  overview: '/app/procurement',
  requisitions: '/app/procurement/requisitions',
  'purchase-orders': '/app/procurement/purchase-orders',
  receiving: '/app/procurement/receiving',
  suppliers: '/app/procurement/suppliers',
};

function getActiveTab(pathname: string): ProcurementTab {
  if (pathname.includes('/requisitions')) return 'requisitions';
  if (pathname.includes('/purchase-orders')) return 'purchase-orders';
  if (pathname.includes('/receiving')) return 'receiving';
  if (pathname.includes('/suppliers')) return 'suppliers';
  return 'overview';
}

export default function ProcurementHubTabs() {
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
