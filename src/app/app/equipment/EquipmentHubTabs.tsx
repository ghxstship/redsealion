'use client';

import { useRouter, usePathname } from 'next/navigation';
import Tabs from '@/components/ui/Tabs';

type EquipmentTab = 'inventory' | 'bundles' | 'maintenance' | 'assets';

const TABS: Array<{ key: EquipmentTab; label: string }> = [
  { key: 'inventory', label: 'Inventory' },
  { key: 'bundles', label: 'Bundles' },
  { key: 'maintenance', label: 'Maintenance' },
  { key: 'assets', label: 'Assets' },
];

const TAB_ROUTES: Record<EquipmentTab, string> = {
  inventory: '/app/equipment',
  bundles: '/app/equipment/bundles',
  maintenance: '/app/equipment/maintenance',
  assets: '/app/equipment/assets',
};

function getActiveTab(pathname: string): EquipmentTab {
  if (pathname.includes('/bundles')) return 'bundles';
  if (pathname.includes('/maintenance')) return 'maintenance';
  if (pathname.includes('/assets')) return 'assets';
  return 'inventory';
}

export default function EquipmentHubTabs() {
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
