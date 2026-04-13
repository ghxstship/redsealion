import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import ProposalTabs from '@/components/portal/ProposalTabs';

interface ProposalLayoutProps {
  children: ReactNode;
  params: Promise<{ orgSlug: string; id: string }>;
}

export async function generateMetadata({ params }: ProposalLayoutProps): Promise<Metadata> {
  const { orgSlug, id } = await params;
  const supabase = await createClient();

  const { data: proposal } = await supabase
    .from('proposals')
    .select('name, status, event_date, organizations(name, logo_url)')
    .eq('id', id)
    .single();

  if (!proposal) {
    return { title: 'Proposal' };
  }

  const org = proposal.organizations as unknown as { name: string; logo_url: string | null } | null;
  const orgName = org?.name ?? orgSlug;
  const title = `${proposal.name} | ${orgName}`;
  const description = `View proposal "${proposal.name}" from ${orgName}${
    proposal.event_date ? ` — Event date: ${new Date(proposal.event_date).toLocaleDateString()}` : ''
  }`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      images: org?.logo_url ? [org.logo_url] : [],
      siteName: orgName,
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
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
