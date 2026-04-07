'use client';

import { useRouter, usePathname } from 'next/navigation';
import Tabs from '@/components/ui/Tabs';

type FabricationTab = 'orders' | 'bom' | 'shop-floor' | 'print' | 'quality';

const TABS: Array<{ key: FabricationTab; label: string }> = [
  { key: 'orders', label: 'Orders' },
  { key: 'bom', label: 'Bill of Materials' },
  { key: 'shop-floor', label: 'Shop Floor' },
  { key: 'print', label: 'Print' },
  { key: 'quality', label: 'Quality' },
];

const TAB_ROUTES: Record<FabricationTab, string> = {
  orders: '/app/fabrication',
  bom: '/app/fabrication/bom',
  'shop-floor': '/app/fabrication/shop-floor',
  print: '/app/fabrication/print',
  quality: '/app/fabrication/quality',
};

function getActiveTab(pathname: string): FabricationTab {
  if (pathname.includes('/bom')) return 'bom';
  if (pathname.includes('/shop-floor')) return 'shop-floor';
  if (pathname.includes('/print')) return 'print';
  if (pathname.includes('/quality')) return 'quality';
  return 'orders';
}

export default function FabricationHubTabs() {
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
