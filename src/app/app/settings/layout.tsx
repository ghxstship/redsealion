'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

const sections = [
  {
    title: 'Organization',
    items: [
      { label: 'General', href: '/app/settings' },
      { label: 'Branding', href: '/app/settings/branding' },
      { label: 'Localization', href: '/app/settings/localization' },
      { label: 'Facilities', href: '/app/settings/facilities' },
    ],
  },
  {
    title: 'People',
    items: [
      { label: 'Team Members', href: '/app/settings/team' },
      { label: 'Roles & Permissions', href: '/app/settings/security/permissions' },
      { label: 'Notifications', href: '/app/settings/notifications' },
      { label: 'Email Templates', href: '/app/settings/email-templates' },
    ],
  },
  {
    title: 'Display',
    items: [
      { label: 'Appearance', href: '/app/settings/appearance' },
    ],
  },
  {
    title: 'Billing',
    items: [
      { label: 'Plans & Billing', href: '/app/settings/billing' },
      { label: 'Payment Terms', href: '/app/settings/payment-terms' },
      { label: 'Stripe Connect', href: '/app/settings/payments' },
    ],
  },
  {
    title: 'Security',
    items: [
      { label: 'Overview', href: '/app/settings/security' },
      { label: 'Audit Log', href: '/app/settings/security/audit-log' },
    ],
  },
  {
    title: 'Developer',
    items: [
      { label: 'Integrations', href: '/app/settings/integrations' },
      { label: 'Calendar Sync', href: '/app/settings/calendar-sync' },
      { label: 'API Keys & Webhooks', href: '/app/settings/api-keys' },
      { label: 'Automations', href: '/app/settings/automations-config' },
    ],
  },
  {
    title: 'Content',
    items: [
      { label: 'Custom Fields', href: '/app/settings/custom-fields' },
      { label: 'Tags & Categories', href: '/app/settings/tags' },
      { label: 'Document Defaults', href: '/app/settings/document-defaults' },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'Profile', href: '/app/settings/profile' },
      { label: 'Data & Privacy', href: '/app/settings/data-privacy' },
    ],
  },
];

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Manage your organization and account preferences.
        </p>
      </div>
      <div className="flex gap-8 items-start">
        <nav className="w-52 shrink-0 hidden md:block sticky top-16">
          <div className="space-y-5 max-h-[calc(100vh-5rem)] overflow-y-auto">
            {sections.map((section) => (
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
  );
}
