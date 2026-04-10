import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PortalRequestForm from '@/components/portal/PortalRequestForm';
import type { Metadata } from 'next';

interface PortalRequestPageProps {
  params: Promise<{ orgSlug: string }>;
}

export async function generateMetadata({ params }: PortalRequestPageProps): Promise<Metadata> {
  const { orgSlug } = await params;
  const supabase = await createClient();
  const { data: org } = await supabase.from('organizations').select('name').eq('slug', orgSlug).single();
  return { title: `Request Work | ${org?.name ?? orgSlug}` };
}

export default async function PortalRequestPage({ params }: PortalRequestPageProps) {
  const { orgSlug } = await params;

  const supabase = await createClient();

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('slug', orgSlug)
    .single();

  if (!org) {
    redirect('/');
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Request Work
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Submit a project request to {org.name}. We&apos;ll review your details and get back to you promptly.
        </p>
      </div>

      <PortalRequestForm
        orgSlug={orgSlug}
        orgId={org.id}
        orgName={org.name}
      />
    </div>
  );
}
