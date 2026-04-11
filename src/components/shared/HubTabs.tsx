'use client';

import { useRouter, usePathname } from 'next/navigation';
import Tabs from '@/components/ui/Tabs';

interface HubTabDef {
  key: string;
  label: string;
}

interface HubTabsProps {
  /** Base route with trailing slash, e.g. '/app/advancing/' */
  basePath: string;
  /** Tab definitions. The first tab is the default/overview tab. */
  tabs: HubTabDef[];
  /** Extra className on the Tabs wrapper. */
  className?: string;
}

/**
 * Generic HubTabs component.
 * Replaces 4+ identical HubTabs boilerplate components (Advancing, Automations, Campaigns, Clients).
 *
 * Usage:
 *   <HubTabs basePath="/app/advancing/" tabs={[{ key: '', label: 'Overview' }, { key: 'submissions', label: 'Submissions' }]} />
 */
export default function HubTabs({ basePath, tabs, className = 'mb-8' }: HubTabsProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Determine which tab is active from the URL
  const normalizedBase = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;

  function getActiveTab(): string {
    // Walk tabs in reverse so more-specific segments match first
    for (let i = tabs.length - 1; i > 0; i--) {
      if (tabs[i].key && pathname.includes(`/${tabs[i].key}`)) {
        return tabs[i].key;
      }
    }
    return tabs[0]?.key ?? '';
  }

  function routeForTab(key: string): string {
    return key ? `${normalizedBase}/${key}` : normalizedBase;
  }

  const activeTab = getActiveTab();

  return (
    <Tabs
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={(key) => router.push(routeForTab(key))}
      className={className}
    />
  );
}
