import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import EmptyState from '@/components/ui/EmptyState';
import type { Metadata } from 'next';

interface PortfolioPageProps {
  params: Promise<{ orgSlug: string }>;
}

export async function generateMetadata({ params }: PortfolioPageProps): Promise<Metadata> {
  const { orgSlug } = await params;
  const supabase = await createClient();
  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('slug', orgSlug)
    .single();

  return {
    title: `Portfolio | ${org?.name ?? orgSlug}`,
    description: `Explore the event production portfolio of ${org?.name ?? orgSlug}.`,
    openGraph: {
      title: `Portfolio | ${org?.name ?? orgSlug}`,
      description: `Event production work by ${org?.name ?? orgSlug}.`,
      type: 'website',
    },
  };
}

interface PortfolioItem {
  id: string;
  project_name: string;
  project_year: number | null;
  category: string;
  client_name: string | null;
  description: string | null;
  image_url: string | null;
  tags: string[];
}

export default async function PublicPortfolioPage({ params }: PortfolioPageProps) {
  const { orgSlug } = await params;
  const supabase = await createClient();

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('slug', orgSlug)
    .single();

  if (!org) notFound();

  const { data } = await supabase
    .from('portfolio_library')
    .select('id, project_name, project_year, category, client_name, description, image_url, tags')
    .eq('organization_id', org.id)
    .eq('is_published', true)
    .is('deleted_at', null)
    .order('project_year', { ascending: false });

  const items = (data ?? []) as PortfolioItem[];

  // Unique categories for filtering
  const categories = [...new Set(items.map(i => i.category))].sort();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Portfolio
        </h1>
        <p className="mt-2 text-text-secondary">
          {items.length} project{items.length !== 1 ? 's' : ''} by {org.name}
        </p>
      </div>

      {/* Category pills */}
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <span
              key={cat}
              className="rounded-full border border-border px-3 py-1 text-xs font-medium text-text-secondary"
            >
              {cat}
            </span>
          ))}
        </div>
      )}

      {/* Grid */}
      {items.length === 0 ? (
        <EmptyState
          message="No published projects"
          description={`${org.name} hasn't published any portfolio items yet.`}
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="group rounded-xl border border-border bg-background overflow-hidden hover:shadow-md transition-shadow"
            >
              {item.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.image_url}
                  alt={item.project_name}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-bg-secondary flex items-center justify-center">
                  <span className="text-3xl">🎪</span>
                </div>
              )}

              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-semibold text-foreground leading-snug pr-2">
                    {item.project_name}
                  </h3>
                  {item.project_year && (
                    <span className="text-xs text-text-muted shrink-0">{item.project_year}</span>
                  )}
                </div>

                <span className="inline-block rounded-full bg-bg-tertiary px-2 py-0.5 text-[10px] font-medium text-text-secondary">
                  {item.category}
                </span>

                {item.description && (
                  <p className="mt-3 text-xs text-text-secondary line-clamp-3">
                    {item.description}
                  </p>
                )}

                {item.tags && item.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {item.tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="rounded border border-border px-1.5 py-0.5 text-[10px] text-text-muted"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: `${org.name} Portfolio`,
            description: `Event production portfolio by ${org.name}`,
            mainEntity: items.map((item) => ({
              '@type': 'CreativeWork',
              name: item.project_name,
              description: item.description,
              creator: { '@type': 'Organization', name: org.name },
              dateCreated: item.project_year ? `${item.project_year}-01-01` : undefined,
              image: item.image_url,
            })),
          }),
        }}
      />
    </div>
  );
}
