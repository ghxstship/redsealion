import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { notFound } from 'next/navigation';
import PageHeader from '@/components/shared/PageHeader';
import Link from 'next/link';

import { RoleGate } from '@/components/shared/RoleGate';
interface PortfolioDetail {
  id: string;
  project_name: string;
  project_year: number | null;
  category: string;
  client_name: string | null;
  description: string | null;
  image_url: string | null;
  tags: string[];
  venue: string | null;
  location: string | null;
  services_provided: string[];
  results: string | null;
  project_id: string | null;
  proposal_id: string | null;
  created_at: string;
}

async function getPortfolioItem(id: string): Promise<PortfolioDetail | null> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return null;

    const { data } = await supabase
      .from('portfolio_library')
      .select('id, project_name, project_year, category, client_name, description, image_url, tags, venue, location, services_provided, results, project_id, proposal_id, created_at')
      .eq('id', id)
      .eq('organization_id', ctx.organizationId)
      .is('deleted_at', null)
      .single();

    if (!data) return null;

    return {
      id: data.id,
      project_name: data.project_name,
      project_year: data.project_year,
      category: data.category,
      client_name: data.client_name,
      description: data.description,
      image_url: data.image_url,
      tags: data.tags ?? [],
      venue: data.venue ?? null,
      location: data.location ?? null,
      services_provided: data.services_provided ?? [],
      results: data.results ?? null,
      project_id: data.project_id,
      proposal_id: data.proposal_id,
      created_at: data.created_at,
    };
  } catch {
    return null;
  }
}

export default async function PortfolioDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getPortfolioItem(id);
  if (!item) notFound();

  return (
    <RoleGate>
    <>
      <div className="mb-4">
        <Link href="/app/portfolio" className="text-sm text-text-muted hover:text-foreground mb-2 inline-block">
          &larr; Back to Portfolio
        </Link>
        <PageHeader
          title={item.project_name}
          subtitle={[item.category, item.project_year ? String(item.project_year) : null, item.client_name].filter(Boolean).join(' · ')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image */}
          {item.image_url && (
            <div className="rounded-xl border border-border bg-background overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.image_url} alt={item.project_name} className="w-full h-auto max-h-[400px] object-cover" />
            </div>
          )}

          {/* Description */}
          {item.description && (
            <div className="rounded-xl border border-border bg-background p-6">
              <h3 className="text-sm font-semibold text-foreground mb-3">About This Project</h3>
              <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{item.description}</p>
            </div>
          )}

          {/* Results */}
          {item.results && (
            <div className="rounded-xl border border-border bg-background p-6">
              <h3 className="text-sm font-semibold text-foreground mb-3">Results & Impact</h3>
              <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{item.results}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-background p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Details</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-text-muted">Category</dt>
                <dd className="text-foreground capitalize">{item.category}</dd>
              </div>
              {item.project_year && (
                <div className="flex justify-between">
                  <dt className="text-text-muted">Year</dt>
                  <dd className="text-foreground">{item.project_year}</dd>
                </div>
              )}
              {item.client_name && (
                <div className="flex justify-between">
                  <dt className="text-text-muted">Client</dt>
                  <dd className="text-foreground">{item.client_name}</dd>
                </div>
              )}
              {item.venue && (
                <div className="flex justify-between">
                  <dt className="text-text-muted">Venue</dt>
                  <dd className="text-foreground">{item.venue}</dd>
                </div>
              )}
              {item.location && (
                <div className="flex justify-between">
                  <dt className="text-text-muted">Location</dt>
                  <dd className="text-foreground">{item.location}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Tags */}
          {item.tags.length > 0 && (
            <div className="rounded-xl border border-border bg-background p-6">
              <h3 className="text-sm font-semibold text-foreground mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center rounded-full bg-bg-secondary px-3 py-1 text-xs font-medium text-text-secondary">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Services */}
          {item.services_provided.length > 0 && (
            <div className="rounded-xl border border-border bg-background p-6">
              <h3 className="text-sm font-semibold text-foreground mb-3">Services Provided</h3>
              <ul className="space-y-1.5">
                {item.services_provided.map((service) => (
                  <li key={service} className="text-sm text-text-secondary flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-foreground/40 flex-shrink-0" />
                    {service}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Linked records */}
          {(item.project_id || item.proposal_id) && (
            <div className="rounded-xl border border-border bg-background p-6">
              <h3 className="text-sm font-semibold text-foreground mb-3">Linked Records</h3>
              <div className="space-y-2">
                {item.proposal_id && (
                  <Link href={`/app/proposals/${item.proposal_id}`} className="block text-sm text-blue-600 hover:underline">
                    View Proposal →
                  </Link>
                )}
                {item.project_id && (
                  <Link href={`/app/projects/${item.project_id}`} className="block text-sm text-blue-600 hover:underline">
                    View Project →
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  </RoleGate>
  );
}
