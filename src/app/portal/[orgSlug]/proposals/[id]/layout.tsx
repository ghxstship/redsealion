import type { ReactNode } from 'react';
import Link from 'next/link';

interface ProposalLayoutProps {
  children: ReactNode;
  params: Promise<{ orgSlug: string; id: string }>;
}

const tabs = [
  { label: 'Journey', segment: '' },
  { label: 'Milestones', segment: '/milestones' },
  { label: 'Files', segment: '/files' },
  { label: 'Invoices', segment: '/invoices' },
  { label: 'Progress', segment: '/progress' },
  { label: 'Comments', segment: '/comments' },
];

export default async function ProposalLayout({ children, params }: ProposalLayoutProps) {
  const { orgSlug, id } = await params;

  const basePath = `/portal/${orgSlug}/proposals/${id}`;

  // Placeholder — will be replaced with Supabase fetch
  const proposalName = 'Nike Air Max Day Experience';

  return (
    <div className="space-y-6">
      {/* Proposal header */}
      <div>
        <Link
          href={`/portal/${orgSlug}`}
          className="text-xs text-text-muted hover:text-text-secondary transition-colors"
        >
          &larr; Back to proposals
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
          {proposalName}
        </h1>
      </div>

      {/* Sub-navigation tabs */}
      <nav className="flex gap-1 border-b border-border overflow-x-auto">
        {tabs.map((tab) => (
          <Link
            key={tab.segment}
            href={`${basePath}${tab.segment}`}
            className="whitespace-nowrap px-4 py-2.5 text-sm font-medium text-text-muted hover:text-foreground border-b-2 border-transparent hover:border-text-muted transition-colors -mb-px"
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {/* Page content */}
      <div>{children}</div>
    </div>
  );
}
