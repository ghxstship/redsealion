import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import EmptyState from '@/components/ui/EmptyState';

interface OrgLandingProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function OrgLandingPage({ params }: OrgLandingProps) {
  const { orgSlug } = await params;
  const supabase = await createClient();

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, slug, logo_url')
    .eq('slug', orgSlug)
    .single();

  if (!org) notFound();

  // Fetch published portfolio items
  const { data: portfolioItems } = await supabase
    .from('portfolio_library')
    .select('id, project_name, category, image_url, description')
    .eq('organization_id', org.id)
    .eq('is_published', true)
    .is('deleted_at', null)
    .order('project_year', { ascending: false })
    .limit(6);

  // Fetch open public jobs
  const { data: openJobs, count: jobCount } = await supabase
    .from('work_orders')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', org.id)
    .eq('is_public_board', true)
    .is('deleted_at', null)
    .in('status', ['draft', 'dispatched']);

  const hasPortfolio = (portfolioItems ?? []).length > 0;
  const hasJobs = (jobCount ?? 0) > 0;

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="text-center py-12">
        {org.logo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={org.logo_url}
            alt={org.name}
            className="mx-auto h-16 w-auto object-contain mb-6"
          />
        )}
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          {org.name}
        </h1>
        <p className="mt-4 text-lg text-text-secondary max-w-2xl mx-auto">
          Explore our portfolio and discover open opportunities.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          {hasPortfolio && (
            <Link
              href={`/o/${orgSlug}/portfolio`}
              className="rounded-xl bg-foreground px-6 py-3 text-sm font-semibold text-white shadow-md hover:opacity-90 transition-opacity"
            >
              View Portfolio
            </Link>
          )}
          {hasJobs && (
            <Link
              href={`/portal/${orgSlug}/contractor`}
              className="rounded-xl border border-border px-6 py-3 text-sm font-medium text-foreground hover:bg-bg-secondary transition-colors"
            >
              {jobCount} Open Jobs →
            </Link>
          )}
        </div>
      </section>

      {/* Featured portfolio */}
      {hasPortfolio && (
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-6">Featured Work</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(portfolioItems ?? []).map((item) => {
              const typedItem = item as { id: string; project_name: string; category: string; image_url: string | null; description: string | null };
              return (
              <div
                key={typedItem.id}
                className="group rounded-xl border border-border bg-background overflow-hidden hover:shadow-md transition-shadow"
              >
                {typedItem.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={typedItem.image_url}
                    alt={typedItem.project_name}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-foreground">{typedItem.project_name}</h3>
                  {typedItem.category && (
                    <p className="text-xs text-text-muted mt-0.5">{typedItem.category}</p>
                  )}
                  {typedItem.description && (
                    <p className="text-xs text-text-secondary mt-2 line-clamp-2">{typedItem.description}</p>
                  )}
                </div>
              </div>
              );
            })}
          </div>
          {(portfolioItems ?? []).length >= 6 && (
            <div className="text-center mt-8">
              <Link
                href={`/o/${orgSlug}/portfolio`}
                className="text-sm font-medium text-foreground hover:underline"
              >
                View all projects →
              </Link>
            </div>
          )}
        </section>
      )}

      {/* Contact CTA */}
      <section className="text-center py-12 rounded-xl border border-border bg-bg-secondary/50">
        <h2 className="text-xl font-semibold text-foreground">Get in Touch</h2>
        <p className="mt-2 text-sm text-text-secondary max-w-md mx-auto">
          Interested in working with {org.name}? Reach out through our portal.
        </p>
        <div className="mt-6">
          <Link
            href={`/portal/${orgSlug}`}
            className="rounded-xl bg-foreground px-6 py-3 text-sm font-semibold text-white shadow-md hover:opacity-90 transition-opacity"
          >
            Client Portal
          </Link>
        </div>
      </section>
    </div>
  );
}
