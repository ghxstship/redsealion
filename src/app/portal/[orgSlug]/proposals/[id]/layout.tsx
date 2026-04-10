import type { ReactNode } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import ProposalTabs from '@/components/portal/ProposalTabs';

interface ProposalLayoutProps {
  children: ReactNode;
  params: Promise<{ orgSlug: string; id: string }>;
}

export default async function ProposalLayout({ children, params }: ProposalLayoutProps) {
  const { orgSlug, id } = await params;

  const basePath = `/portal/${orgSlug}/proposals/${id}`;

  // Fetch proposal name from Supabase
  const supabase = await createClient();
  const { data: proposal } = await supabase
    .from('proposals')
    .select('name')
    .eq('id', id)
    .single();

  const proposalName = proposal?.name ?? 'Proposal';

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
      <ProposalTabs basePath={basePath} />

      {/* Page content */}
      <div>{children}</div>
    </div>
  );
}
