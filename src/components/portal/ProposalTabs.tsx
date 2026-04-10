'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from '@/lib/clsx';

interface ProposalTabsProps {
  basePath: string;
}

const tabs = [
  { label: 'Journey', segment: '' },
  { label: 'Milestones', segment: '/milestones' },
  { label: 'Files', segment: '/files' },
  { label: 'Invoices', segment: '/invoices' },
  { label: 'Progress', segment: '/progress' },
  { label: 'Comments', segment: '/comments' },
];

export default function ProposalTabs({ basePath }: ProposalTabsProps) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 border-b border-border overflow-x-auto">
      {tabs.map((tab) => {
        const href = `${basePath}${tab.segment}`;
        const isActive = tab.segment === ''
          ? pathname === basePath
          : pathname.startsWith(href);

        return (
          <Link
            key={tab.segment}
            href={href}
            className={clsx(
              'whitespace-nowrap px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
              isActive
                ? 'text-foreground border-foreground'
                : 'text-text-muted hover:text-foreground border-transparent hover:border-text-muted'
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
