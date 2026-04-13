import { TierGate } from '@/components/shared/TierGate';
import Link from 'next/link';
import PageHeader from '@/components/shared/PageHeader';
import Card from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

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
      <PageHeader
        title="Security Settings"
        subtitle="Manage security, audit logging, and access controls."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {sections.map((section) => (
          <Link
            key={section.title}
            href={section.href}
            className="group rounded-xl border border-border bg-background px-6 py-6 transition-[color,background-color,border-color,opacity,box-shadow,transform] duration-normal hover:shadow-md hover:-translate-y-0.5"
          >
            <h3 className="text-sm font-semibold text-foreground group-hover:underline">
              {section.title}
            </h3>
            <p className="mt-2 text-xs text-text-secondary">{section.description}</p>
          </Link>
        ))}
      </div>

      <Card className="mt-8">
        <h2 className="text-base font-semibold text-foreground mb-4">SSO Configuration</h2>
        <TierGate feature="sso">
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="text-sm font-medium text-foreground">Single Sign-On</p>
                <p className="text-xs text-text-secondary">Enforce SSO for all team members</p>
              </div>
              <Badge variant="muted">Not configured</Badge>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="text-sm font-medium text-foreground">Multi-Factor Authentication</p>
                <p className="text-xs text-text-secondary">Require MFA for all users</p>
              </div>
              <Badge variant="muted">Optional</Badge>
            </div>
          </div>
        </TierGate>
      </Card>
    </TierGate>
  );
}
