import { BaseIntegrationAdapter, type SyncResult, type IntegrationStatus } from './base';
import { createServiceClient } from '@/lib/supabase/server';

const QB_API_BASE = 'https://quickbooks.api.intuit.com/v3';
const QB_SANDBOX_API_BASE = 'https://sandbox-quickbooks.api.intuit.com/v3';

/**
 * QuickBooks Online integration adapter.
 *
 * Supports:
 * - OAuth2 connect flow (redirect to Intuit authorization)
 * - Outbound invoice push (FlyteDeck → QuickBooks)
 * - Inbound payment status pull (QuickBooks → FlyteDeck)
 * - Token management: stores access/refresh tokens in `integrations` table
 */
export class QuickBooksAdapter extends BaseIntegrationAdapter {
  readonly platform = 'quickbooks' as const;
  readonly displayName = 'QuickBooks';
  readonly description = 'Push invoices and reconcile payments with QuickBooks Online.';
  readonly category = 'accounting' as const;

  private get apiBase(): string {
    return process.env.QUICKBOOKS_SANDBOX === 'true' ? QB_SANDBOX_API_BASE : QB_API_BASE;
  }

  async connect(config: Record<string, unknown>): Promise<{ authUrl: string }> {
    const clientId = config.clientId ?? process.env.QUICKBOOKS_CLIENT_ID;
    const redirectUri =
      config.redirectUri ??
      `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/quickbooks/callback`;
    const scopes = 'com.intuit.quickbooks.accounting';
    const state = config.state ?? crypto.randomUUID();

    const authUrl = [
      'https://appcenter.intuit.com/connect/oauth2',
      `?client_id=${clientId}`,
      `&redirect_uri=${encodeURIComponent(String(redirectUri))}`,
      `&scope=${encodeURIComponent(scopes)}`,
      `&response_type=code`,
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
      // Revoke token at Intuit
      const clientId = process.env.QUICKBOOKS_CLIENT_ID ?? '';
      const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET ?? '';
      const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

      await fetch('https://developer.api.intuit.com/v2/oauth2/tokens/revoke', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: creds.refresh_token }),
      }).catch(() => { /* best-effort, failure is non-critical */ }); // Best-effort revocation
    }

    // Remove integration record
    await supabase.from('integrations').delete().eq('id', integrationId);
  }

  async sync(
    integrationId: string,
    direction: 'inbound' | 'outbound',
  ): Promise<SyncResult> {
    const supabase = await createServiceClient();

    // Load integration + tokens
    const { data: integration } = await supabase
      .from('integrations')
      .select('credentials, organization_id, external_account_id')
      .eq('id', integrationId)
      .single();

    if (!integration?.credentials) {
      return { entityType: 'invoice', entityCount: 0, errors: ['Integration not connected'] };
    }

    const creds = integration.credentials as Record<string, string>;
    const realmId = integration.external_account_id;
    const accessToken = creds.access_token;

    if (!realmId || !accessToken) {
      // Flag the DB entry as needing re-authorization
      await supabase
        .from('integrations')
        .update({ status: 'error', last_error: 'Re-authorization required: token expired or missing' })
        .eq('id', integrationId);

      return { entityType: 'invoice', entityCount: 0, errors: ['auth_required'] };
    }

    if (direction === 'outbound') {
      return this.pushInvoices(supabase, integration.organization_id, realmId, accessToken);
    }

    return this.pullPayments(supabase, integration.organization_id, realmId, accessToken, integrationId);
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

  private async pushInvoices(
    supabase: Awaited<ReturnType<typeof createServiceClient>>,
    orgId: string,
    realmId: string,
    accessToken: string,
  ): Promise<SyncResult> {
    const errors: string[] = [];

    // Find invoices that haven't been synced to QuickBooks yet
    const { data: invoices } = await supabase
      .from('invoices')
      .select('id, invoice_number, total, due_date, currency, client_id, quickbooks_id')
      .eq('organization_id', orgId)
      .is('quickbooks_id', null)
      .in('status', ['sent', 'partially_paid'])
      .limit(50);

    const unsynced = invoices ?? [];
    let syncedCount = 0;

    for (const inv of unsynced) {
      try {
        // Get client info for QuickBooks customer reference
        const { data: client } = await supabase
          .from('clients')
          .select('company_name')
          .eq('id', inv.client_id)
          .single();

        // Create invoice in QuickBooks
        const qbInvoice = {
          Line: [
            {
              Amount: inv.total,
              DetailType: 'SalesItemLineDetail',
              SalesItemLineDetail: {
                ItemRef: { name: 'Services', value: '1' },
              },
              Description: `Invoice ${inv.invoice_number}`,
            },
          ],
          CustomerRef: { name: client?.company_name ?? 'Customer' },
          DueDate: inv.due_date,
          DocNumber: inv.invoice_number,
          CurrencyRef: { value: inv.currency ?? 'USD' },
        };

        const res = await fetch(
          `${this.apiBase}/company/${realmId}/invoice`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify(qbInvoice),
          },
        );

        if (res.ok) {
          const qbData = await res.json();
          const qbId = qbData?.Invoice?.Id;

          if (qbId) {
            await supabase
              .from('invoices')
              .update({ quickbooks_id: String(qbId) })
              .eq('id', inv.id);
            syncedCount++;
          }
        } else {
          const errText = await res.text();
          errors.push(`Invoice ${inv.invoice_number}: ${errText.slice(0, 200)}`);
        }
      } catch (err) {
        errors.push(`Invoice ${inv.invoice_number}: ${String(err)}`);
      }
    }

    return { entityType: 'invoice', entityCount: syncedCount, errors };
  }

  private async pullPayments(
    supabase: Awaited<ReturnType<typeof createServiceClient>>,
    orgId: string,
    realmId: string,
    accessToken: string,
    integrationId: string,
  ): Promise<SyncResult> {
    const errors: string[] = [];

    // Find invoices that have been synced to QuickBooks
    const { data: invoices } = await supabase
      .from('invoices')
      .select('id, quickbooks_id, amount_paid, total')
      .eq('organization_id', orgId)
      .not('quickbooks_id', 'is', null)
      .in('status', ['sent', 'partially_paid'])
      .limit(50);

    const synced = invoices ?? [];
    let updatedCount = 0;

    for (const inv of synced) {
      try {
        const res = await fetch(
          `${this.apiBase}/company/${realmId}/invoice/${inv.quickbooks_id}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/json',
            },
          },
        );

        if (res.ok) {
          const qbData = await res.json();
          const qbBalance = qbData?.Invoice?.Balance ?? 0;
          const qbTotal = qbData?.Invoice?.TotalAmt ?? inv.total;
          const newAmountPaid = qbTotal - qbBalance;

          if (newAmountPaid > (inv.amount_paid ?? 0)) {
            const newStatus =
              qbBalance <= 0 ? 'paid' : 'partially_paid';

            await supabase
              .from('invoices')
              .update({
                amount_paid: newAmountPaid,
                status: newStatus,
              })
              .eq('id', inv.id);
            updatedCount++;
          }
        } else {
          errors.push(`QB Invoice ${inv.quickbooks_id}: HTTP ${res.status}`);
        }
      } catch (err) {
        errors.push(`QB Invoice ${inv.quickbooks_id}: ${String(err)}`);
      }
    }

    // Update last sync timestamp
    await supabase
      .from('integrations')
      .update({
        last_sync_at: new Date().toISOString(),
        last_error: errors.length > 0 ? errors.join('; ') : null,
      })
      .eq('id', integrationId);

    return { entityType: 'payment', entityCount: updatedCount, errors };
  }
}
