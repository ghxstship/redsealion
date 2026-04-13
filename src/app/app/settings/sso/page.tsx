import { createClient } from '@/lib/supabase/server';
import { TierGate } from '@/components/shared/TierGate';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import PageHeader from '@/components/shared/PageHeader';
import { Badge } from '@/components/ui/Badge';

interface SsoConfig {
  id: string;
  provider: string;
  clientId: string;
  metadataUrl: string | null;
  enabled: boolean;
}

async function getSsoConfig(): Promise<SsoConfig | null> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) throw new Error('No auth');

    const { data } = await supabase
      .from('sso_configurations')
      .select('id, provider, client_id, metadata_url, enabled')
      .eq('organization_id', ctx.organizationId)
      .limit(1)
      .maybeSingle();

    if (!data) return null;

    return {
      id: data.id,
      provider: data.provider,
      clientId: data.client_id,
      metadataUrl: data.metadata_url,
      enabled: data.enabled,
    };
  } catch {
    return null;
  }
}

export default async function SsoSettingsPage() {
  const config = await getSsoConfig();

  return (
    <TierGate feature="sso">
<PageHeader
        title="Single Sign-On (SSO)"
        subtitle="Configure SAML or OIDC single sign-on for your organization."
      />

      <div className="max-w-2xl space-y-6">
        {/* Status card */}
        <div className="rounded-xl border border-border bg-background p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`h-3 w-3 rounded-full ${config?.enabled ? 'bg-success' : 'bg-text-muted'}`} />
              <span className="text-sm font-medium text-foreground">
                {config?.enabled ? 'SSO Enabled' : 'SSO Not Configured'}
              </span>
            </div>
            {config && (
              <Badge variant={config.enabled ? 'success' : 'muted'}>
                {config.enabled ? 'Active' : 'Inactive'}
              </Badge>
            )}
          </div>

          {config ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-text-muted mb-1">Provider</label>
                <p className="text-sm text-foreground uppercase">{config.provider}</p>
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-text-muted mb-1">Client ID</label>
                <p className="text-sm text-foreground font-mono">{config.clientId}</p>
              </div>
              {config.metadataUrl && (
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-text-muted mb-1">Metadata URL</label>
                  <p className="text-sm text-text-secondary break-all">{config.metadataUrl}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-text-secondary">
                SSO allows your team members to sign in using your organization&apos;s identity provider (IdP).
                Supported protocols include SAML 2.0 and OIDC.
              </p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border p-4 hover:border-foreground/20 transition-colors cursor-pointer">
                  <h3 className="text-sm font-semibold text-foreground">SAML 2.0</h3>
                  <p className="mt-1 text-xs text-text-secondary">Okta, Azure AD, OneLogin, PingIdentity</p>
                </div>
                <div className="rounded-lg border border-border p-4 hover:border-foreground/20 transition-colors cursor-pointer">
                  <h3 className="text-sm font-semibold text-foreground">OIDC</h3>
                  <p className="mt-1 text-xs text-text-secondary">Google Workspace, Auth0, Keycloak</p>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-xs text-text-muted">
                  Contact support to configure SSO for your organization. You&apos;ll need your IdP metadata URL and client credentials.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ACS URL info */}
        <div className="rounded-xl border border-border bg-bg-secondary/30 p-6">
          <h3 className="text-sm font-semibold text-foreground mb-3">Service Provider Information</h3>
          <div className="space-y-2">
            <div>
              <span className="text-xs text-text-muted">ACS URL</span>
              <p className="text-sm font-mono text-foreground">{`${process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://your-project.supabase.co'}/auth/v1/sso/saml/acs`}</p>
            </div>
            <div>
              <span className="text-xs text-text-muted">Entity ID</span>
              <p className="text-sm font-mono text-foreground">{`${process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://your-project.supabase.co'}/auth/v1/sso/saml/metadata`}</p>
            </div>
          </div>
        </div>
      </div>
    </TierGate>
  );
}
