import AdminSidebar from '@/components/admin/AdminSidebar';
import PageTransition from '@/components/shared/PageTransition';
import CommandPalette from '@/components/shared/CommandPalette';
import NotificationBell from '@/components/shared/NotificationBell';
import { SubscriptionProvider } from '@/components/shared/SubscriptionProvider';
import { createClient } from '@/lib/supabase/server';
import type { SubscriptionTier } from '@/types/database';

async function getOrgTier(): Promise<SubscriptionTier> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return 'free';

    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!userData) return 'free';

    const { data: org } = await supabase
      .from('organizations')
      .select('subscription_tier')
      .eq('id', userData.organization_id)
      .single();

    return (org?.subscription_tier as SubscriptionTier) || 'free';
  } catch {
    // Supabase not configured or no auth — default to free
    return 'free';
  }
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tier = await getOrgTier();

  return (
    <SubscriptionProvider tier={tier}>
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <main className="flex-1 min-w-0 md:ml-0">
          {/* Top bar */}
          <div className="sticky top-0 z-20 flex items-center justify-end gap-2 px-6 py-3 md:px-10 bg-background/80 backdrop-blur-sm border-b border-border/50">
            <NotificationBell />
          </div>
          <div className="px-6 py-8 md:px-10 md:py-10 max-w-7xl mx-auto">
            <PageTransition>
              {children}
            </PageTransition>
          </div>
        </main>
      </div>
      <CommandPalette />
    </SubscriptionProvider>
  );
}
