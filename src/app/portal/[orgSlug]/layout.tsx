import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import PortalHeader from '@/components/portal/PortalHeader';
import PortalFooter from '@/components/portal/PortalFooter';
import { getBrandCSSVariables, getDefaultBrandConfig } from '@/lib/brand';
import { createClient } from '@/lib/supabase/server';

interface PortalLayoutProps {
  children: ReactNode;
  params: Promise<{ orgSlug: string }>;
}

export default async function PortalLayout({ children, params }: PortalLayoutProps) {
  const { orgSlug } = await params;

  const supabase = await createClient();

  // Look up the organization by slug
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, slug, logo_url, brand_config')
    .eq('slug', orgSlug)
    .single();

  if (!org) {
    redirect('/');
  }

  const brandConfig = org.brand_config ?? getDefaultBrandConfig();
  const cssVariables = getBrandCSSVariables(brandConfig);

  return (
    <div style={cssVariables} className="min-h-screen flex flex-col bg-background">
      <PortalHeader orgName={org.name} logoUrl={org.logo_url} />

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-6 lg:px-8 py-10">
          {children}
        </div>
      </main>

      <PortalFooter orgName={org.name} footerText={brandConfig.footerText} />
    </div>
  );
}
