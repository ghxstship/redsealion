'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { usePermissions } from '@/components/shared/PermissionsProvider';
import { useSubscription } from '@/components/shared/SubscriptionProvider';
import { RoleGate } from '@/components/shared/RoleGate';
import PageHeader from '@/components/shared/PageHeader';
import type { FeatureKey } from '@/lib/subscription';
import { getRequiredTier, getTierLabel } from '@/lib/subscription';
import { LockIcon } from '@/components/shared/TierBadge';

interface SettingsItem {
  label: string;
  href: string;
  feature?: FeatureKey;
}

const sections: { title: string; requiresAdmin: boolean; items: SettingsItem[] }[] = [
  {
    title: 'Organization',
    requiresAdmin: true,
    items: [
      { label: 'General', href: '/app/settings' },
      { label: 'Branding', href: '/app/settings/branding' },
      { label: 'Localization', href: '/app/settings/localization' },
      { label: 'Facilities', href: '/app/settings/facilities' },
    ],
  },
  {
    title: 'People',
    requiresAdmin: true,
    items: [
      { label: 'Team Members', href: '/app/settings/team' },
      { label: 'Roles & Permissions', href: '/app/settings/security/permissions', feature: 'permissions' },
      { label: 'Notifications', href: '/app/settings/notifications' },
      { label: 'Email Templates', href: '/app/settings/email-templates' },
    ],
  },
  {
    title: 'Display',
    requiresAdmin: false,
    items: [
      { label: 'Appearance', href: '/app/settings/appearance' },
    ],
  },
  {
    title: 'Billing',
    requiresAdmin: true,
    items: [
      { label: 'Plans & Billing', href: '/app/settings/billing' },
      { label: 'Payment Terms', href: '/app/settings/payment-terms' },
      { label: 'Tax Settings', href: '/app/settings/tax' },
      { label: 'Stripe Connect', href: '/app/settings/payments' },
      { label: 'Cost Rates', href: '/app/settings/cost-rates', feature: 'profitability' },
    ],
  },
  {
    title: 'Security',
    requiresAdmin: true,
    items: [
      { label: 'Overview', href: '/app/settings/security' },
      { label: 'SSO', href: '/app/settings/sso', feature: 'sso' },
      { label: 'Audit Log', href: '/app/settings/security/audit-log', feature: 'audit_log' },
    ],
  },
  {
    title: 'Developer',
    requiresAdmin: true,
    items: [
      { label: 'Integrations', href: '/app/settings/integrations', feature: 'integrations' },
      { label: 'Calendar Sync', href: '/app/settings/calendar-sync' },
      { label: 'API Keys', href: '/app/settings/api-keys' },
      { label: 'Webhooks', href: '/app/settings/webhooks', feature: 'integrations' },
      { label: 'Automations', href: '/app/settings/automations-config', feature: 'automations' },
    ],
  },
  {
    title: 'Content',
    requiresAdmin: true,
    items: [
      { label: 'Custom Fields', href: '/app/settings/custom-fields', feature: 'custom_fields' },
      { label: 'Tags & Categories', href: '/app/settings/tags' },
      { label: 'Document Defaults', href: '/app/settings/document-defaults' },
    ],
  },
  {
    title: 'Account',
    requiresAdmin: false,
    items: [
      { label: 'Profile', href: '/app/settings/profile' },
      { label: 'Data & Privacy', href: '/app/settings/data-privacy' },
    ],
  },
];

function TierBadgeLabel({ feature }: { feature: FeatureKey }) {
  const tier = getRequiredTier(feature);
  const label = getTierLabel(tier);
  // Shorten for sidebar display
  const short = label === 'Professional' ? 'Pro' : label === 'Enterprise' ? 'Ent' : label;
  return (
    <span className="ml-auto shrink-0 rounded bg-bg-tertiary px-1.5 py-0.5 text-[10px] font-medium text-text-muted">
      {short}
    </span>
  );
}

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { can } = usePermissions();
  const { canAccess } = useSubscription();

  const visibleSections = sections.filter(s => {
    if (s.requiresAdmin) {
      return can('settings', 'view');
    }
    return true;
  });

  return (
    <RoleGate allowedRoles={['developer', 'owner', 'admin', 'controller', 'collaborator']}>
    <>
<PageHeader
        title="Settings"
        subtitle="Manage your organization and account preferences."
      />
      <div className="flex gap-8 items-start">
        <nav className="w-52 shrink-0 hidden md:block sticky top-16">
          <div className="space-y-5 max-h-[calc(100vh-5rem)] overflow-y-auto">
            {visibleSections.map((section) => (
              <div key={section.title}>
                <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5 px-3">
                  {section.title}
                </p>
                <ul className="space-y-0.5">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href;
                    const locked = item.feature ? !canAccess(item.feature) : false;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={`flex items-center rounded-md px-3 py-1.5 text-sm transition-colors ${
                            locked
                              ? 'text-text-muted'
                              : isActive
                                ? 'bg-bg-secondary font-medium text-foreground'
                                : 'text-text-secondary hover:text-foreground hover:bg-bg-secondary/50'
                          }`}
                        >
                          <span className="flex-1 truncate">{item.label}</span>
                          {locked && item.feature && <TierBadgeLabel feature={item.feature} />}
                          {locked && <LockIcon className="ml-1 shrink-0 text-text-muted" />}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </nav>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </>
    </RoleGate>  );
}

