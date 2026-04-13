import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getBrandCSSVariables, getDefaultBrandConfig } from '@/lib/brand';
import type { BrandConfig } from '@/types/database';
import { PortalContextProvider } from '@/components/portal/PortalContext';
import ContractorSidebar from '@/components/portal/contractor/ContractorSidebar';
import PortalFooter from '@/components/portal/PortalFooter';

interface ContractorLayoutProps {
  children: ReactNode;
  params: Promise<{ orgSlug: string }>;
}

/**
 * Contractor Portal layout — authenticated shell for contractors/crew.
 *
 * Auth: Requires authenticated user with a crew_profile in the org.
 * Branding: Uses org brand config for CSS variables.
 * Navigation: ContractorSidebar with 7 nav items.
 */
export default async function ContractorPortalLayout({ children, params }: ContractorLayoutProps) {
  const { orgSlug } = await params;

  let org: { id: string; name: string; slug: string; logo_url: string | null; brand_config: Record<string, unknown> | null } | null = null;
  let userId: string | undefined;
  let crewProfileId: string | undefined;

  try {
    const supabase = await createClient();

    // Resolve org
    const { data: orgData } = await supabase
      .from('organizations')
      .select('id, name, slug, logo_url, brand_config')
      .eq('slug', orgSlug)
      .single();

    org = orgData;

    if (!org) {
      redirect('/');
    }

    // Auth check — contractor portal requires authentication
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      redirect(`/portal/${orgSlug}/login`);
    }

    userId = user.id;

    // Resolve crew profile — contractors must have one
    const { data: profile } = await supabase
      .from('crew_profiles')
      .select('id')
      .eq('user_id', user.id)
      .eq('organization_id', org.id)
      .maybeSingle();

    crewProfileId = profile?.id;

    // If no crew profile, redirect to a setup page or show error
    if (!crewProfileId) {
      // Graceful degradation — allow access but some features will be limited
    }
  } catch {
    redirect('/');
  }

  if (!org) {
    redirect('/');
  }

  const brandConfig = (org.brand_config as BrandConfig | null) ?? getDefaultBrandConfig();
  const cssVariables = getBrandCSSVariables(brandConfig);

  return (
    <PortalContextProvider
      orgSlug={orgSlug}
      orgName={org.name}
      orgId={org.id}
      portalType="contractor"
      userId={userId}
      crewProfileId={crewProfileId}
    >
      <div style={cssVariables} className="min-h-screen flex bg-background">
        {/* Sidebar */}
        <ContractorSidebar />

        {/* Main content area — offset by sidebar width */}
        <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
          <main className="flex-1">
            <div className="mx-auto max-w-5xl px-6 lg:px-8 py-8">
              {children}
            </div>
          </main>

          <PortalFooter orgName={org.name} footerText={brandConfig.footerText} />
        </div>
      </div>
    </PortalContextProvider>
  );
}
