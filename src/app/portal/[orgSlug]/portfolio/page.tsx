import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import EmptyState from '@/components/ui/EmptyState';
import PortalFooter from '@/components/portal/PortalFooter';
import { getBrandCSSVariables, getDefaultBrandConfig } from '@/lib/brand';
type BrandConfig = ReturnType<typeof getDefaultBrandConfig>;
import type { Metadata, ResolvingMetadata } from 'next';

interface PortfolioPageProps {
  params: Promise<{ orgSlug: string }>;
}

export async function generateMetadata(
  { params }: PortfolioPageProps,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _parent: ResolvingMetadata,
): Promise<Metadata> {
  const { orgSlug } = await params;
  const supabase = await createClient();
  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('slug', orgSlug)
    .single();

  return {
    title: `Portfolio | ${org?.name ?? orgSlug}`,
    description: `View the public portfolio of ${org?.name ?? orgSlug}.`,
    openGraph: {
      title: `Portfolio | ${org?.name ?? orgSlug}`,
      description: `Explore our showcase of completed projects and creative work.`,
      type: 'website',
    },
  };
}

export default async function PublicPortfolioPage({ params }: PortfolioPageProps) {
  const { orgSlug } = await params;
  const supabase = await createClient();

  // Look up org
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, slug, logo_url, brand_config, is_public')
    .eq('slug', orgSlug)
    .single();

  if (!org) notFound();

  // Gate: Only show if organization has public portfolio enabled
  if (!org.is_public) {
    notFound();
  }

  const brandConfig = (org.brand_config as BrandConfig | null) ?? getDefaultBrandConfig();
  const cssVariables = getBrandCSSVariables(brandConfig);

  // Fetch published portfolio items (community access — no auth required)
  const { data: portfolioItems } = await supabase
    .from('portfolio_library')
    .select('id, title, description, cover_image_url, category, status, published_at')
    .eq('organization_id', org.id)
    .eq('is_public', true)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(50);

  return (
    <div style={cssVariables} className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background">
        <div className="mx-auto max-w-6xl px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            {org.logo_url && (
              <Image
                src={org.logo_url}
                alt={`${org.name} logo`}
                width={40}
                height={40}
                className="rounded-lg"
              />
            )}
            <div>
              <h1 className="text-xl font-semibold text-foreground">{org.name}</h1>
              <p className="text-sm text-text-secondary">Portfolio</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-6 lg:px-8 py-10">
          {(portfolioItems ?? []).length === 0 ? (
            <EmptyState
              message="No portfolio items"
              description="Check back later for published work."
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {(portfolioItems ?? []).map((item) => (
                <article
                  key={item.id}
                  className="group rounded-lg border border-border bg-background overflow-hidden transition-[border-color,box-shadow] duration-normal hover:border-text-muted hover:shadow-md"
                >
                  {/* Cover image */}
                  {item.cover_image_url ? (
                    <div className="aspect-video relative bg-bg-secondary">
                      <Image
                        src={item.cover_image_url}
                        alt={item.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-bg-secondary flex items-center justify-center">
                      <svg
                        className="w-10 h-10 text-text-muted/30"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
                        />
                      </svg>
                    </div>
                  )}

                  {/* Card body */}
                  <div className="p-4 space-y-2">
                    {item.category && (
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-bg-secondary text-text-muted uppercase tracking-wider">
                        {item.category}
                      </span>
                    )}
                    <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-xs text-text-secondary line-clamp-3">
                        {item.description}
                      </p>
                    )}
                    {item.published_at && (
                      <p className="text-[11px] text-text-muted">
                        {new Date(item.published_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>

      <PortalFooter orgName={org.name} footerText={brandConfig.footerText} />
    </div>
  );
}
