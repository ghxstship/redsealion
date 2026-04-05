import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

interface PortalReferPageProps {
  params: Promise<{ orgSlug: string }>;
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

        <div className="border-t border-border pt-6">
          <h2 className="text-sm font-semibold text-foreground mb-3">Your Referral Link</h2>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={`${typeof window !== 'undefined' ? window.location.origin : ''}/api/public/referral/YOUR-CODE`}
              className="flex-1 rounded-md border border-border bg-bg-secondary px-3 py-2 text-sm text-text-muted"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <button
              className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'var(--org-primary, var(--color-foreground))' }}
              onClick={() => {
                /* navigator.clipboard in client wrapper */
              }}
            >
              Copy
            </button>
          </div>
          <p className="mt-2 text-xs text-text-muted">
            Sign in to generate your personalized referral code.
          </p>
        </div>
      </div>
    </div>
  );
}
