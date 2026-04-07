import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import PortfolioHeader from '@/components/admin/portfolio/PortfolioHeader';
import EmptyState from '@/components/ui/EmptyState';

const CATEGORIES = ['All', 'Pop-Up', 'Installation', 'Festival', 'Launch', 'Retail'];

interface PortfolioItem {
  id: string;
  project_name: string;
  project_year: number | null;
  category: string;
  client_name: string | null;
  description: string | null;
  image_url: string;
}

async function getPortfolioItems(): Promise<PortfolioItem[]> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) throw new Error('No auth');
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];
const { data: items } = await supabase
      .from('portfolio_library')
      .select('id, project_name, project_year, category, client_name, description, image_url')
      .eq('organization_id', ctx.organizationId)
      .order('project_year', { ascending: false });

    return (items ?? []) as PortfolioItem[];
  } catch {
    return [];
  }
}

export default async function PortfolioPage() {
  const portfolioItems = await getPortfolioItems();

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Portfolio
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {portfolioItems.length} project{portfolioItems.length !== 1 ? 's' : ''} in your portfolio library.
          </p>
        </div>
        <PortfolioHeader />
      </div>

      {/* Category filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        {CATEGORIES.map((cat, idx) => (
          <button
            key={cat}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              idx === 0
                ? 'bg-foreground text-white'
                : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      {portfolioItems.length === 0 ? (
        <EmptyState
          message="No portfolio projects yet"
          description="Upload completed projects to showcase your work."
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {portfolioItems.map((item) => (
            <div
              key={item.id}
              className="group rounded-xl border border-border bg-white overflow-hidden transition-colors hover:border-foreground/20"
            >
              {/* Image */}
              <div className="relative aspect-[4/3] bg-bg-tertiary flex items-center justify-center overflow-hidden">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.project_name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="text-center px-4">
                    <p className="text-sm font-medium text-text-muted">{item.client_name ?? 'Project'}</p>
                    <p className="mt-1 text-xs text-text-muted">No image</p>
                  </div>
                )}
              </div>
              {/* Info */}
              <div className="px-4 py-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-foreground leading-snug">
                    {item.project_name}
                  </p>
                  {item.project_year && (
                    <span className="shrink-0 text-xs tabular-nums text-text-muted">
                      {item.project_year}
                    </span>
                  )}
                </div>
                <span className="mt-2 inline-flex items-center rounded-full bg-bg-secondary px-2.5 py-0.5 text-xs font-medium text-text-secondary">
                  {item.category}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
