import AdminSidebar from '@/components/admin/AdminSidebar';
import AppHeader from '@/components/shared/AppHeader';
import PageTransition from '@/components/shared/PageTransition';
import CommandPalette from '@/components/shared/CommandPalette';
import { SubscriptionProvider } from '@/components/shared/SubscriptionProvider';
import { PermissionsProvider } from '@/components/shared/PermissionsProvider';
import { createClient } from '@/lib/supabase/server';
import type { SubscriptionTier, OrganizationRole } from '@/types/database';
import { DEFAULT_PERMISSIONS } from '@/lib/permissions';

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
}

const DEFAULT_CONTEXT: SessionContext = {
  tier: 'free',
  user: { fullName: 'User', email: '', role: 'org_admin', avatarUrl: null },
  orgName: 'FlyteDeck',
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
    const roleData = membership?.roles as unknown as { name: string } | null;
    const role = roleData?.name || 'org_admin';

    const { data: org } = orgId
      ? await supabase
          .from('organizations')
          .select('name, subscription_tier')
          .eq('id', orgId)
          .single()
      : { data: null };

    return {
      tier: (org?.subscription_tier as SubscriptionTier) || 'free',
      user: {
        fullName: userData.full_name || 'User',
        email: userData.email || authUser.email || '',
        role: role,
        avatarUrl: userData.avatar_url,
      },
      orgName: org?.name || 'FlyteDeck',
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

  return (
    <PermissionsProvider
      role={ctx.user.role}
      permissions={DEFAULT_PERMISSIONS[ctx.user.role as OrganizationRole] ?? {}}
    >
      <SubscriptionProvider tier={ctx.tier}>
        <div className="flex min-h-screen bg-background">
          <AdminSidebar user={ctx.user} />
          <main className="flex-1 min-w-0 md:ml-64">
            <AppHeader user={ctx.user} orgName={ctx.orgName} />
            <div className="px-6 py-8 md:px-10 md:py-10 max-w-7xl mx-auto">
              <PageTransition>
                {children}
              </PageTransition>
            </div>
          </main>
        </div>
        <CommandPalette />
      </SubscriptionProvider>
    </PermissionsProvider>
  );
}
