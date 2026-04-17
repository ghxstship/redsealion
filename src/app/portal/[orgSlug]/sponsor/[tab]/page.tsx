import { notFound } from 'next/navigation';
import PageHeader from '@/components/shared/PageHeader';

const VALID_TABS = ['overview', 'branding', 'activations', 'signage', 'credentials', 'reporting'];

export default async function SponsorTabPage({ params }: { params: Promise<{ orgSlug: string; tab: string }> }) {
  const { orgSlug, tab } = await params;
  
  if (!VALID_TABS.includes(tab)) {
    notFound();
  }

  const title = tab.charAt(0).toUpperCase() + tab.slice(1);

  return (
    <>
      <PageHeader 
        title={`Sponsor: ${title}`} 
        subtitle="Manage your sponsor benefits and activations." 
      />
      <div className="rounded-xl border border-border bg-background p-6">
        <p className="text-sm text-text-secondary">
          The {title} module for the sponsor portal is currently under construction.
        </p>
      </div>
    </>
  );
}
