import { BaseIntegrationAdapter, type SyncResult, type IntegrationStatus } from './base';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * Salesforce CRM integration adapter.
 *
 * Supports:
 * - OAuth2 connect flow (redirect to Salesforce login)
 * - Inbound contact/account import (Salesforce → FlyteDeck clients)
 * - Outbound opportunity push (FlyteDeck deals → Salesforce opportunities)
 * - Token management: stores access/refresh tokens in `integrations` table
 */
export class SalesforceAdapter extends BaseIntegrationAdapter {
  readonly platform = 'salesforce' as const;
  readonly displayName = 'Salesforce';
  readonly description = 'Import contacts and push opportunities to Salesforce CRM.';
  readonly category = 'crm' as const;

  async connect(config: Record<string, unknown>): Promise<{ authUrl: string }> {
    const clientId = config.clientId ?? process.env.SALESFORCE_CLIENT_ID;
    const redirectUri =
      config.redirectUri ??
      `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/salesforce/callback`;
    const state = config.state ?? crypto.randomUUID();

    const authUrl = [
      'https://login.salesforce.com/services/oauth2/authorize',
      `?response_type=code`,
      `&client_id=${clientId}`,
      `&redirect_uri=${encodeURIComponent(String(redirectUri))}`,
      `&state=${state}`,
    ].join('');

    return { authUrl };
  }

  async disconnect(integrationId: string): Promise<void> {
    const supabase = await createServiceClient();

    // Load tokens
    const { data: integration } = await supabase
      .from('integrations')
      .select('credentials')
      .eq('id', integrationId)
      .single();

    if (integration?.credentials) {
      const creds = integration.credentials as Record<string, string>;
      // Revoke token at Salesforce
      if (creds.access_token && creds.instance_url) {
        await fetch(`${creds.instance_url}/services/oauth2/revoke`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `token=${creds.access_token}`,
        }).catch(() => { /* best-effort, failure is non-critical */ }); // Best-effort
      }
    }

    await supabase.from('integrations').delete().eq('id', integrationId);
  }

  async sync(
    integrationId: string,
    direction: 'inbound' | 'outbound',
  ): Promise<SyncResult> {
    const supabase = await createServiceClient();

    const { data: integration } = await supabase
      .from('integrations')
      .select('credentials, organization_id')
      .eq('id', integrationId)
      .single();

    if (!integration?.credentials) {
      return { entityType: 'client', entityCount: 0, errors: ['Integration not connected'] };
    }

    const creds = integration.credentials as Record<string, string>;
    const { access_token, instance_url } = creds;

    if (!access_token || !instance_url) {
      return { entityType: 'client', entityCount: 0, errors: ['Missing Salesforce credentials'] };
    }

    if (direction === 'inbound') {
      return this.importContacts(supabase, integration.organization_id, instance_url, access_token, integrationId);
    }

    return this.pushOpportunities(supabase, integration.organization_id, instance_url, access_token, integrationId);
  }

  async getStatus(integrationId: string): Promise<IntegrationStatus> {
    const supabase = await createServiceClient();

    const { data: integration } = await supabase
      .from('integrations')
      .select('status, last_sync_at, last_error')
      .eq('id', integrationId)
      .single();

    if (!integration) {
      return { connected: false, lastSyncAt: null, error: null };
    }

    return {
      connected: integration.status === 'active',
      lastSyncAt: integration.last_sync_at,
      error: integration.last_error,
    };
  }

  // ─── Private Methods ─────────────────────────────────────────────────

  private async importContacts(
    supabase: Awaited<ReturnType<typeof createServiceClient>>,
    orgId: string,
    instanceUrl: string,
    accessToken: string,
    integrationId: string,
  ): Promise<SyncResult> {
    const errors: string[] = [];
    let importedCount = 0;

    try {
      // Query Salesforce Accounts (companies)
      const query = encodeURIComponent(
        'SELECT Id, Name, Website, Phone, BillingStreet, BillingCity, BillingState, BillingPostalCode, BillingCountry FROM Account ORDER BY LastModifiedDate DESC LIMIT 100',
      );

      const res = await fetch(
        `${instanceUrl}/services/data/v59.0/query?q=${query}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
          },
        },
      );

      if (!res.ok) {
        const errText = await res.text();
        return { entityType: 'client', entityCount: 0, errors: [`Salesforce API: ${errText.slice(0, 300)}`] };
      }

      const data = await res.json();
      const accounts = (data.records ?? []) as Array<Record<string, string | null>>;

      for (const account of accounts) {
        try {
          // Check if client already exists (by salesforce_id)
          const { data: existing } = await supabase
            .from('clients')
            .select('id')
            .eq('organization_id', orgId)
            .eq('salesforce_id', account.Id)
            .maybeSingle();

          if (existing) continue; // Already imported

          // Also skip if company name already exists
          const { data: nameMatch } = await supabase
            .from('clients')
            .select('id')
            .eq('organization_id', orgId)
            .eq('company_name', account.Name ?? '')
            .maybeSingle();

          if (nameMatch) {
            // Link the Salesforce ID to the existing client
            await supabase
              .from('clients')
              .update({ salesforce_id: account.Id })
              .eq('id', nameMatch.id);
            continue;
          }

          // Create new client
          const address = {
            street: account.BillingStreet ?? '',
            city: account.BillingCity ?? '',
            state: account.BillingState ?? '',
            postal_code: account.BillingPostalCode ?? '',
            country: account.BillingCountry ?? '',
          };

          await supabase.from('clients').insert({
            organization_id: orgId,
            company_name: account.Name ?? 'Unknown Company',
            website: account.Website ?? null,
            phone: account.Phone ?? null,
            address,
            salesforce_id: account.Id,
          });

          importedCount++;
        } catch (err) {
          errors.push(`Account ${account.Name}: ${String(err)}`);
        }
      }

      // Now import Contacts associated with those accounts
      const contactQuery = encodeURIComponent(
        'SELECT Id, FirstName, LastName, Email, Phone, Title, AccountId FROM Contact WHERE Email != null ORDER BY LastModifiedDate DESC LIMIT 200',
      );

      const contactRes = await fetch(
        `${instanceUrl}/services/data/v59.0/query?q=${contactQuery}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
          },
        },
      );

      if (contactRes.ok) {
        const contactData = await contactRes.json();
        const contacts = (contactData.records ?? []) as Array<Record<string, string | null>>;

        for (const contact of contacts) {
          try {
            if (!contact.Email || !contact.AccountId) continue;

            // Find the client by salesforce account ID
            const { data: client } = await supabase
              .from('clients')
              .select('id')
              .eq('organization_id', orgId)
              .eq('salesforce_id', contact.AccountId)
              .maybeSingle();

            if (!client) continue;

            // Check if contact already exists
            const { data: existingContact } = await supabase
              .from('client_contacts')
              .select('id')
              .eq('client_id', client.id)
              .eq('email', contact.Email)
              .maybeSingle();

            if (existingContact) continue;

            await supabase.from('client_contacts').insert({
              client_id: client.id,
              first_name: contact.FirstName ?? '',
              last_name: contact.LastName ?? '',
              email: contact.Email,
              phone: contact.Phone ?? null,
              title: contact.Title ?? null,
              contact_role: 'primary',
            });
          } catch (err) {
            errors.push(`Contact ${contact.Email}: ${String(err)}`);
          }
        }
      }
    } catch (err) {
      errors.push(`Import failed: ${String(err)}`);
    }

    // Update sync status
    await supabase
      .from('integrations')
      .update({
        last_sync_at: new Date().toISOString(),
        last_error: errors.length > 0 ? errors.join('; ') : null,
      })
      .eq('id', integrationId);

    return { entityType: 'client', entityCount: importedCount, errors };
  }

  private async pushOpportunities(
    supabase: Awaited<ReturnType<typeof createServiceClient>>,
    orgId: string,
    instanceUrl: string,
    accessToken: string,
    integrationId: string,
  ): Promise<SyncResult> {
    const errors: string[] = [];
    let pushedCount = 0;

    try {
      // Find deals not yet synced to Salesforce
      const { data: deals } = await supabase
        .from('deals')
        .select('id, name, deal_value, stage, probability_percent, close_date, client_id, salesforce_id')
        .eq('organization_id', orgId)
        .is('salesforce_id', null)
        .limit(50);

      for (const deal of deals ?? []) {
        try {
          // Map FlyteDeck stage to Salesforce stage
          const sfStage = this.mapStageToSalesforce(deal.stage);

          // Get client's Salesforce account ID
          const { data: client } = await supabase
            .from('clients')
            .select('salesforce_id, company_name')
            .eq('id', deal.client_id)
            .single();

          const opportunity = {
            Name: deal.name,
            Amount: deal.deal_value ?? 0,
            StageName: sfStage,
            Probability: deal.probability_percent ?? 50,
            CloseDate: deal.close_date ?? new Date().toISOString().split('T')[0],
            ...(client?.salesforce_id
              ? { AccountId: client.salesforce_id }
              : {}),
          };

          const res = await fetch(
            `${instanceUrl}/services/data/v59.0/sobjects/Opportunity`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              },
              body: JSON.stringify(opportunity),
            },
          );

          if (res.ok) {
            const sfData = await res.json();
            if (sfData.id) {
              await supabase
                .from('deals')
                .update({ salesforce_id: sfData.id })
                .eq('id', deal.id);
              pushedCount++;
            }
          } else {
            const errText = await res.text();
            errors.push(`Deal "${deal.name}": ${errText.slice(0, 200)}`);
          }
        } catch (err) {
          errors.push(`Deal "${deal.name}": ${String(err)}`);
        }
      }
    } catch (err) {
      errors.push(`Push failed: ${String(err)}`);
    }

    await supabase
      .from('integrations')
      .update({
        last_sync_at: new Date().toISOString(),
        last_error: errors.length > 0 ? errors.join('; ') : null,
      })
      .eq('id', integrationId);

    return { entityType: 'opportunity', entityCount: pushedCount, errors };
  }

  private mapStageToSalesforce(stage: string): string {
    const stageMap: Record<string, string> = {
      lead: 'Prospecting',
      qualified: 'Qualification',
      proposal: 'Proposal/Price Quote',
      negotiation: 'Negotiation/Review',
      won: 'Closed Won',
      lost: 'Closed Lost',
    };
    return stageMap[stage] ?? 'Qualification';
  }
}
