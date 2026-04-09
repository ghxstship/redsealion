import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import PortfolioHeader from '@/components/admin/portfolio/PortfolioHeader';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/shared/PageHeader';
import PortfolioGrid from '@/components/admin/portfolio/PortfolioGrid';

interface PortfolioItem {
  id: string;
  project_name: string;
  project_year: number | null;
  category: string;
  client_name: string | null;
  description: string | null;
  image_url: string | null;
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
      <PageHeader
        title="Portfolio"
        subtitle={`${portfolioItems.length} project${portfolioItems.length !== 1 ? 's' : ''} in your portfolio library.`}
      >
        <PortfolioHeader />
      </PageHeader>

      {portfolioItems.length === 0 ? (
        <EmptyState
          message="No portfolio projects yet"
          description="Upload completed projects to showcase your work."
        />
      ) : (
        <PortfolioGrid items={portfolioItems} />
      )}
    </>
  );
}
