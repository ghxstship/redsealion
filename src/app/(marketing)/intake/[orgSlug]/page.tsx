import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LeadIntakeForm } from '@/components/forms/LeadIntakeForm';
import Link from 'next/link';

interface IntakePageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function IntakePage({ params }: IntakePageProps) {
  const { orgSlug } = await params;
  
  // We use the normal client but might need service client if the slug lookup is restricted
  // Wait, `organizations` table usually has public read or at least unauthenticated read for slug resolving.
  // Assuming it can be read without auth for this purpose.
  // We'll use the server client and let RLS handle it. If RLS blocks unauthenticated users from reading orgs,
  // we would need a service role here or build a public view.
  const supabase = await createClient();
  
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
            <img src={org.logo_url} alt={org.name} className="h-16 w-auto mx-auto mb-4" />
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
