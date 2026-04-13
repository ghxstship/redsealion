'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { usePermissions } from '@/components/shared/PermissionsProvider';
import { RoleGate } from '@/components/shared/RoleGate';
import PageHeader from '@/components/shared/PageHeader';

const sections = [
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
      { label: 'Roles & Permissions', href: '/app/settings/security/permissions' },
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
      { label: 'Cost Rates', href: '/app/settings/cost-rates' },
    ],
  },
  {
    title: 'Security',
    requiresAdmin: true,
    items: [
      { label: 'Overview', href: '/app/settings/security' },
      { label: 'SSO', href: '/app/settings/sso' },
      { label: 'Audit Log', href: '/app/settings/security/audit-log' },
    ],
  },
  {
    title: 'Developer',
    requiresAdmin: true,
    items: [
      { label: 'Integrations', href: '/app/settings/integrations' },
      { label: 'Calendar Sync', href: '/app/settings/calendar-sync' },
      { label: 'API Keys', href: '/app/settings/api-keys' },
      { label: 'Webhooks', href: '/app/settings/webhooks' },
      { label: 'Automations', href: '/app/settings/automations-config' },
    ],
  },
  {
    title: 'Content',
    requiresAdmin: true,
    items: [
      { label: 'Custom Fields', href: '/app/settings/custom-fields' },
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

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { can } = usePermissions();

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
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={`block rounded-md px-3 py-1.5 text-sm transition-colors ${
                            isActive
                              ? 'bg-bg-secondary font-medium text-foreground'
                              : 'text-text-secondary hover:text-foreground hover:bg-bg-secondary/50'
                          }`}
                        >
                          {item.label}
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
