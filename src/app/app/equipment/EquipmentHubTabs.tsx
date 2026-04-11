'use client';

import { useRouter, usePathname } from 'next/navigation';
import Tabs from '@/components/ui/Tabs';

type EquipmentTab = 'inventory' | 'check-in-out' | 'bundles' | 'maintenance' | 'assets';

const TABS: Array<{ key: EquipmentTab; label: string }> = [
  { key: 'assets', label: 'Assets' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'check-in-out', label: 'Check In/Out' },
  { key: 'bundles', label: 'Bundles' },
  { key: 'maintenance', label: 'Maintenance' },
];
const TAB_ROUTES: Record<EquipmentTab, string> = {
  assets: '/app/equipment',
  inventory: '/app/equipment/inventory',
  'check-in-out': '/app/equipment/check-in-out',
  bundles: '/app/equipment/bundles',
  maintenance: '/app/equipment/maintenance',
};

function getActiveTab(pathname: string): EquipmentTab {
  if (pathname.includes('/inventory')) return 'inventory';
  if (pathname.includes('/check-in-out')) return 'check-in-out';
  if (pathname.includes('/bundles')) return 'bundles';
  if (pathname.includes('/maintenance')) return 'maintenance';
  if (pathname.includes('/assets')) return 'assets';
  return 'assets';
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
