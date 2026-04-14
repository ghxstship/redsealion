import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/server';
import { LeadIntakeForm } from '@/components/forms/LeadIntakeForm';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';

interface IntakePageProps {
  params: Promise<{ orgSlug: string }>;
}

export async function generateMetadata({ params }: IntakePageProps): Promise<Metadata> {
  const { orgSlug } = await params;
  const supabase = await createServiceClient();
  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('slug', orgSlug)
    .single();

  return {
    title: org ? `Start Your Project — ${org.name}` : 'Start Your Project',
    description: org
      ? `Submit a project inquiry to ${org.name}. Tell us about your upcoming event, activation, or production.`
      : 'Submit a project inquiry to get started.',
  };
}

export default async function IntakePage({ params }: IntakePageProps) {
  const { orgSlug } = await params;
  
  // Service client required: the organizations table has RLS that requires
  // authentication, but this is a public-facing page for unauthenticated visitors.
  const supabase = await createServiceClient();
  
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, logo_url')
    .eq('slug', orgSlug)
    .single();

  if (!org) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col pt-16 pb-20 px-4 sm:px-6 lg:px-8">
      {/* Background styling for visual flair */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:32px_32px] pointer-events-none" />
      
      <div className="flex-1 w-full flex flex-col items-center justify-center relative z-10 space-y-10">
        
        {/* Branding header */}
        <div className="text-center">
          {org.logo_url ? (
            <Image
              src={org.logo_url}
              alt={`${org.name} logo`}
              width={256}
              height={64}
              unoptimized
              className="h-16 w-auto mx-auto mb-4"
            />
          ) : (
            <div className="h-16 w-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20">
              <span className="text-2xl font-bold text-white">{org.name.charAt(0)}</span>
            </div>
          )}
          <h1 className="text-xl font-medium text-white/60">
            Work with <span className="text-white font-semibold">{org.name}</span>
          </h1>
        </div>

        {/* The Glassmorphic Form */}
        <LeadIntakeForm organizationId={org.id} />

      </div>

      <div className="mt-16 text-center text-sm text-white/40 relative z-10">
        <p>
          Powered by <Link href="/" className="text-white hover:underline transition-colors">FlyteDeck</Link>
        </p>
      </div>
    </div>
  );
}
