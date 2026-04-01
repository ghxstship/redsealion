import type { ReactNode } from 'react';
import PortalHeader from '@/components/portal/PortalHeader';
import PortalFooter from '@/components/portal/PortalFooter';
import { getBrandCSSVariables, getDefaultBrandConfig } from '@/lib/brand';

interface PortalLayoutProps {
  children: ReactNode;
  params: Promise<{ orgSlug: string }>;
}

export default async function PortalLayout({ children, params }: PortalLayoutProps) {
  const { orgSlug } = await params;

  // Placeholder org data — will be replaced with Supabase fetch
  const orgName = orgSlug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const brandConfig = getDefaultBrandConfig();
  const cssVariables = getBrandCSSVariables(brandConfig);

  return (
    <div style={cssVariables} className="min-h-screen flex flex-col bg-background">
      <PortalHeader orgName={orgName} logoUrl={null} />

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-6 lg:px-8 py-10">
          {children}
        </div>
      </main>

      <PortalFooter orgName={orgName} footerText={brandConfig.footerText} />
    </div>
  );
}
