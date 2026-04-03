import { TierGate } from '@/components/shared/TierGate';
import Link from 'next/link';

export default function SecurityPage() {
  const sections = [
    {
      title: 'Audit Log',
      description: 'View a complete log of all actions taken in your organization.',
      href: '/app/settings/security/audit-log',
      feature: 'audit_log' as const,
    },
    {
      title: 'Permissions',
      description: 'Configure role-based access controls for your team.',
      href: '/app/settings/security/permissions',
      feature: 'permissions' as const,
    },
  ];

  return (
    <TierGate feature="audit_log">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Security Settings
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Manage security, audit logging, and access controls.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {sections.map((section) => (
          <Link
            key={section.title}
            href={section.href}
            className="group rounded-xl border border-border bg-white px-6 py-6 transition-[color,background-color,border-color,opacity,box-shadow,transform] duration-normal hover:shadow-md hover:-translate-y-0.5"
          >
            <h3 className="text-sm font-semibold text-foreground group-hover:underline">
              {section.title}
            </h3>
            <p className="mt-2 text-xs text-text-secondary">{section.description}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-border bg-white px-6 py-6">
        <h2 className="text-base font-semibold text-foreground mb-4">SSO Configuration</h2>
        <TierGate feature="sso">
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="text-sm font-medium text-foreground">Single Sign-On</p>
                <p className="text-xs text-text-secondary">Enforce SSO for all team members</p>
              </div>
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                Not configured
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="text-sm font-medium text-foreground">Multi-Factor Authentication</p>
                <p className="text-xs text-text-secondary">Require MFA for all users</p>
              </div>
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                Optional
              </span>
            </div>
          </div>
        </TierGate>
      </div>
    </TierGate>
  );
}
