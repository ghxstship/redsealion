'use client';

import { useRouter, usePathname } from 'next/navigation';
import Tabs from '@/components/ui/Tabs';

/**
 * Generic hub tab navigation — L-06 remediation.
 * Replaces 6 near-identical *HubTabs components with a single data-driven one.
 */

interface HubTab {
  key: string;
  label: string;
  route: string;
  /** Pathname substring match for active detection. Falls back to exact match on the first tab. */
  match?: string;
}

interface HubTabNavigationProps {
  tabs: HubTab[];
  className?: string;
}

export default function HubTabNavigation({ tabs, className = 'mb-8' }: HubTabNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();

  const activeTab =
    tabs.find((t) => t.match && pathname.includes(t.match))?.key ??
    tabs[0]?.key ??
    '';

  const routeMap = Object.fromEntries(tabs.map((t) => [t.key, t.route]));

  return (
    <Tabs
      tabs={tabs.map((t) => ({ key: t.key, label: t.label }))}
      activeTab={activeTab}
      onTabChange={(key) => router.push(routeMap[key])}
      className={className}
    />
  );
}
