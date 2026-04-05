import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PortalMagicLinkForm from '@/components/portal/PortalMagicLinkForm';

interface PortalLoginPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function PortalLoginPage({ params }: PortalLoginPageProps) {
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
    <div className="flex min-h-[60vh] items-center justify-center">
      <PortalMagicLinkForm orgSlug={orgSlug} orgName={org.name} />
    </div>
  );
}
