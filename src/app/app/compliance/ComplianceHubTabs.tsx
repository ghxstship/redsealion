'use client';

import { useRouter, usePathname } from 'next/navigation';
import Tabs from '@/components/ui/Tabs';

type ComplianceTab = 'overview' | 'contracts' | 'cois' | 'licenses' | 'permits' | 'certifications';

const TABS: Array<{ key: ComplianceTab; label: string }> = [
  { key: 'overview', label: 'Overview' },
  { key: 'contracts', label: 'Contracts' },
  { key: 'cois', label: 'COIs' },
  { key: 'licenses', label: 'Licenses' },
  { key: 'permits', label: 'Permits' },
  { key: 'certifications', label: 'Certifications' },
];

const TAB_ROUTES: Record<ComplianceTab, string> = {
  overview: '/app/compliance',
  contracts: '/app/compliance/contracts',
  cois: '/app/compliance/cois',
  licenses: '/app/compliance/licenses',
  permits: '/app/compliance/permits',
  certifications: '/app/compliance/certifications',
};

function getActiveTab(pathname: string): ComplianceTab {
  if (pathname.includes('/contracts')) return 'contracts';
  if (pathname.includes('/cois')) return 'cois';
  if (pathname.includes('/licenses')) return 'licenses';
  if (pathname.includes('/permits')) return 'permits';
  if (pathname.includes('/certifications')) return 'certifications';
  return 'overview';
}

export default function ComplianceHubTabs() {
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
