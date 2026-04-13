import Link from 'next/link';
import type { ReactNode } from 'react';

interface ViewerLayoutProps {
  children: ReactNode;
  params: Promise<{ orgSlug: string }>;
}

export default async function ViewerLayout({ children, params }: ViewerLayoutProps) {
  const { orgSlug } = await params;

  const navItems = [
    { label: 'Dashboard', href: `/portal/${orgSlug}/viewer` },
    { label: 'Proposals', href: `/portal/${orgSlug}/viewer/proposals` },
    { label: 'Projects', href: `/portal/${orgSlug}/viewer/projects` },
  ];

  return (
    <div>
      <nav className="flex gap-1 mb-6 border-b border-border pb-3">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="px-3 py-1.5 text-sm font-medium text-text-muted rounded-md hover:bg-bg-secondary hover:text-foreground transition-colors"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
