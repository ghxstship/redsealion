import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Metadata } from 'next';
import Link from 'next/link';

interface OrgLayoutProps {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}

export async function generateMetadata({ params }: OrgLayoutProps): Promise<Metadata> {
  const { orgSlug } = await params;
  const supabase = await createClient();
  const { data: org } = await supabase
    .from('organizations')
    .select('name, logo_url')
    .eq('slug', orgSlug)
    .single();

  if (!org) return { title: 'Not Found' };

  return {
    title: `${org.name} | FlyteDeck`,
    description: `Learn more about ${org.name} and explore their portfolio of event production work.`,
    openGraph: {
      title: org.name,
      description: `${org.name} on FlyteDeck — event production portfolio & services.`,
      images: org.logo_url ? [org.logo_url] : [],
      type: 'website',
    },
  };
}

export default async function OrgPublicLayout({ children, params }: OrgLayoutProps) {
  const { orgSlug } = await params;
  const supabase = await createClient();

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, slug, logo_url')
    .eq('slug', orgSlug)
    .single();

  if (!org) notFound();

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {org.logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={org.logo_url} alt={org.name} className="h-8 w-auto object-contain" />
            )}
            <span className="text-lg font-semibold tracking-tight text-foreground">
              {org.name}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link href={`/portal/${orgSlug}`} className="text-text-secondary hover:text-foreground transition-colors">
              Client Portal
            </Link>
            <Link href={`/portal/${orgSlug}/contractor`} className="text-text-secondary hover:text-foreground transition-colors">
              Contractor Portal
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="mx-auto max-w-5xl px-6 py-8 text-center">
          <p className="text-xs text-text-muted">
            © {new Date().getFullYear()} {org.name} • Powered by{' '}
            <Link href="/" className="hover:text-foreground transition-colors">FlyteDeck</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
