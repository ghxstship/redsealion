import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PortalRequestForm from '@/components/portal/PortalRequestForm';

interface PortalRequestPageProps {
  params: Promise<{ orgSlug: string }>;
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
