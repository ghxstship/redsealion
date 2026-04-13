import { RoleGate } from '@/components/shared/RoleGate';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AppHeader from '@/components/shared/AppHeader';
import PageTransition from '@/components/shared/PageTransition';
import CommandPalette from '@/components/shared/CommandPalette';
import { SubscriptionProvider } from '@/components/shared/SubscriptionProvider';
import { PermissionsProvider } from '@/components/shared/PermissionsProvider';
import { GlobalModalProvider } from '@/components/shared/GlobalModalProvider';
import { PreferencesProvider } from '@/components/shared/PreferencesProvider';
import { CopilotProvider } from '@/components/shared/CopilotProvider';
import CopilotPanel from '@/components/shared/CopilotPanel';
import { I18nProvider } from '@/lib/i18n/client';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { DEFAULT_LOCALE, hasLocale, normalizeBareCode } from '@/lib/i18n/config';
import type { SupportedLocale } from '@/lib/i18n/config';
import { createClient } from '@/lib/supabase/server';
import type { SubscriptionTier } from '@/types/database';
import { DEFAULT_PERMISSIONS, mapDBRoleToEnum } from '@/lib/permissions';
import { castRelation } from '@/lib/supabase/cast-relation';
import { cookies } from 'next/headers';

/* ─────────────────────────────────────────────────────────
   Server-side session context
   ───────────────────────────────────────────────────────── */

interface SessionContext {
  tier: SubscriptionTier;
  user: {
    fullName: string;
    email: string;
    role: string;
    avatarUrl: string | null;
  };
  orgName: string;
  locale: SupportedLocale;
}

const DEFAULT_CONTEXT: SessionContext = {
  tier: 'free',
  user: { fullName: 'User', email: '', role: 'team_member', avatarUrl: null },
  orgName: 'FlyteDeck',
  locale: DEFAULT_LOCALE,
};

async function getSessionContext(): Promise<SessionContext> {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) return DEFAULT_CONTEXT;

    const { data: userData } = await supabase
      .from('users')
      .select('full_name, email, avatar_url')
      .eq('id', authUser.id)
      .single();

    if (!userData) return DEFAULT_CONTEXT;

    // Resolve org via organization_memberships (SSOT — users.organization_id was dropped in 00033)
    const { data: membership } = await supabase
      .from('organization_memberships')
      .select('organization_id, roles(name)')
      .eq('user_id', authUser.id)
      .eq('status', 'active')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    const orgId = membership?.organization_id;
    const roleData = castRelation<{ name: string }>(membership?.roles);
    const role = roleData?.name || 'team_member';

    const { data: org } = orgId
      ? await supabase
          .from('organizations')
          .select('name, subscription_tier, language')
          .eq('id', orgId)
          .single()
      : { data: null };

    // Resolve locale: cookie > org setting > default
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get('fd_locale')?.value;
    let resolvedLocale: SupportedLocale = DEFAULT_LOCALE;
    if (cookieLocale && hasLocale(cookieLocale)) {
      resolvedLocale = cookieLocale;
    } else if (org?.language) {
      // The org language may be a bare code ("en") or BCP-47 ("en-US")
      resolvedLocale = hasLocale(org.language)
        ? org.language as SupportedLocale
        : normalizeBareCode(org.language);
    }

    return {
      tier: (org?.subscription_tier as SubscriptionTier) || 'free',
      user: {
        fullName: userData.full_name || 'User',
        email: userData.email || authUser.email || '',
        role: role,
        avatarUrl: userData.avatar_url,
      },
      orgName: org?.name || 'FlyteDeck',
      locale: resolvedLocale,
    };
  } catch {
    return DEFAULT_CONTEXT;
  }
}

/* ─────────────────────────────────────────────────────────
   Layout
   ───────────────────────────────────────────────────────── */

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getSessionContext();
  const dictionary = await getDictionary(ctx.locale);

  return (
    <PermissionsProvider
      role={mapDBRoleToEnum(ctx.user.role)}
      permissions={DEFAULT_PERMISSIONS[mapDBRoleToEnum(ctx.user.role)] ?? {}}
    >
      <SubscriptionProvider tier={ctx.tier}>
        <I18nProvider locale={ctx.locale} dictionary={dictionary}>
          <PreferencesProvider>
            <GlobalModalProvider>
              <CopilotProvider>
                <div className="flex min-h-screen bg-background">
                  <AdminSidebar user={ctx.user} />
                  <main id="main-content" className="flex-1 min-w-0 transition-[margin] duration-normal md:ml-[var(--sidebar-width)]">
                    <AppHeader user={ctx.user} orgName={ctx.orgName} />
                    <div className="px-6 py-8 md:px-10 md:py-10 max-w-7xl mx-auto">
                      <PageTransition>
                        <RoleGate>{children}</RoleGate>
                      </PageTransition>
                    </div>
                  </main>
                  <CopilotPanel />
                </div>
                <CommandPalette />
              </CopilotProvider>
            </GlobalModalProvider>
          </PreferencesProvider>
        </I18nProvider>
      </SubscriptionProvider>
    </PermissionsProvider>
  );
}
