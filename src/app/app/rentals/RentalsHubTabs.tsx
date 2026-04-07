'use client';

import { useRouter, usePathname } from 'next/navigation';
import Tabs from '@/components/ui/Tabs';

type RentalsTab = 'catalog' | 'reservations' | 'sub-rentals' | 'returns' | 'utilization';

const TABS: Array<{ key: RentalsTab; label: string }> = [
  { key: 'catalog', label: 'Catalog' },
  { key: 'reservations', label: 'Reservations' },
  { key: 'sub-rentals', label: 'Sub-Rentals' },
  { key: 'returns', label: 'Returns' },
  { key: 'utilization', label: 'Utilization' },
];

const TAB_ROUTES: Record<RentalsTab, string> = {
  catalog: '/app/rentals',
  reservations: '/app/rentals/reservations',
  'sub-rentals': '/app/rentals/sub-rentals',
  returns: '/app/rentals/returns',
  utilization: '/app/rentals/utilization',
};

function getActiveTab(pathname: string): RentalsTab {
  if (pathname.includes('/reservations')) return 'reservations';
  if (pathname.includes('/sub-rentals')) return 'sub-rentals';
  if (pathname.includes('/returns')) return 'returns';
  if (pathname.includes('/utilization')) return 'utilization';
  return 'catalog';
}

export default function RentalsHubTabs() {
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
