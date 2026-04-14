import { redirect } from 'next/navigation';
import Image from 'next/image';
import { SubscriptionProvider } from '@/components/shared/SubscriptionProvider';
import { PortalContextProvider } from '@/components/portal/PortalContext';
import PortalSidebar from '@/components/portal/PortalSidebar';
import DemoBanner from '@/components/portal/DemoBanner';
import PageTransition from '@/components/shared/PageTransition';
import { resolveOrgFromSlug } from '@/lib/auth/resolve-org-from-slug';
import { IconChevronRight } from '@/components/ui/Icons';

interface PortalAppLayoutProps {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}

/**
 * Portal Demo App Shell
 *
 * Mirrors the admin app layout (sidebar + header + page transitions) but:
 * - Forces tier='portal' so TierGate/canAccess only unlocks the demo-visible features
 * - Wraps everything in PortalContext so child components can resolve orgSlug/orgId
 * - Includes a persistent DemoBanner with a trial CTA
 * - Uses PortalSidebar which rewrites hrefs from /app/* → /portal/[orgSlug]/app/*
 */
export default async function PortalAppLayout({ children, params }: PortalAppLayoutProps) {
  const { orgSlug } = await params;

  const org = await resolveOrgFromSlug(orgSlug);
  if (!org) {
    redirect('/');
  }

  return (
    <SubscriptionProvider tier="portal">
      <PortalContextProvider orgSlug={orgSlug} orgName={org.orgName} orgId={org.organizationId} portalType="client">
        {/* Demo banner — spans full width */}
        <DemoBanner />

        <div className="flex min-h-screen bg-background" style={{ '--sidebar-width': '16rem' } as React.CSSProperties}>
          <PortalSidebar />
          <main className="flex-1 min-w-0 transition-[margin] duration-normal md:ml-[var(--sidebar-width)]">
            {/* Simplified header for portal */}
            <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/60 bg-background/80 backdrop-blur-xl backdrop-saturate-150 px-6 md:px-10 h-14">
              <div className="flex items-center gap-3">
                {org.logoUrl ? (
                  <Image
                    src={org.logoUrl}
                    alt={org.orgName}
                    width={120}
                    height={24}
                    unoptimized
                    className="h-6 w-auto object-contain"
                  />
                ) : (
                  <span className="text-sm font-medium text-text-secondary">
                    {org.orgName}
                  </span>
                )}
                <span className="inline-flex items-center rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700 uppercase tracking-wider">
                  Demo
                </span>
              </div>

              <a
                href={`/portal/${orgSlug}/pricing`}
                className="hidden sm:inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                Upgrade
                <IconChevronRight strokeWidth={1.5} size={14} />
              </a>
            </header>

            <div className="px-6 py-8 md:px-10 md:py-10 max-w-7xl mx-auto">
              <PageTransition>
                {children}
              </PageTransition>
            </div>
          </main>
        </div>
      </PortalContextProvider>
    </SubscriptionProvider>
  );
}
