import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ReferralLinkSection from '@/components/portal/ReferralLinkSection';
import type { Metadata } from 'next';

interface PortalReferPageProps {
  params: Promise<{ orgSlug: string }>;
}

export async function generateMetadata({ params }: PortalReferPageProps): Promise<Metadata> {
  const { orgSlug } = await params;
  const supabase = await createClient();
  const { data: org } = await supabase.from('organizations').select('name').eq('slug', orgSlug).single();
  return { title: `Refer a Friend | ${org?.name ?? orgSlug}` };
}
export default async function PortalReferPage({ params }: PortalReferPageProps) {
  const { orgSlug } = await params;

  const supabase = await createClient();

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('slug', orgSlug)
    .single();

  if (!org) redirect('/');

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If authenticated, look up their referral code
  let referralCode: string | null = null;
  if (user) {
    // Find their client_contact
    const { data: contact } = await supabase
      .from('client_contacts')
      .select('client_id')
      .eq('email', user.email ?? '')
      .limit(1)
      .maybeSingle();

    if (contact) {
      // Look up existing referral code
      const { data: referral } = await supabase
        .from('referrals')
        .select('referral_code')
        .eq('organization_id', org.id)
        .eq('referrer_client_id', contact.client_id)
        .limit(1)
        .maybeSingle();

      referralCode = referral?.referral_code ?? null;
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001';

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Refer a Friend
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Know someone who could benefit from {org.name}&apos;s services? Share your referral link
          and you&apos;ll both benefit when they become a client.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-background p-8 space-y-6">
        {/* How it works */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-4">How It Works</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { step: '1', title: 'Share', desc: 'Send your unique referral link to a friend or colleague.' },
              { step: '2', title: 'Connect', desc: 'They get in touch with us and mention your referral.' },
              { step: '3', title: 'Earn', desc: 'Once they sign on, you receive your referral reward.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-white text-sm font-semibold">
                  {item.step}
                </div>
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                <p className="mt-0.5 text-xs text-text-muted">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Referral link section */}
        <ReferralLinkSection
          referralCode={referralCode}
          appUrl={appUrl}
          isAuthenticated={!!user}
        />
      </div>
    </div>
  );
}
