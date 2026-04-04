import crypto from 'crypto';
import { createServiceClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logger';
import type {
  ESignProvider,
  ESignCreateOptions,
  ESignCreateResult,
  ESignStatusResult,
} from './provider';

const log = createLogger('esign');

/**
 * Built-in e-signature provider.
 *
 * Stores signature requests in the `esignature_requests` table and
 * generates a token-based URL that signers can use without authentication.
 */
export class BuiltInESignProvider implements ESignProvider {
  private orgId: string;
  private orgSlug: string;

  constructor(orgId: string, orgSlug: string) {
    this.orgId = orgId;
    this.orgSlug = orgSlug;
  }

  async createRequest(opts: ESignCreateOptions): Promise<ESignCreateResult> {
    const supabase = await createServiceClient();
    const token = crypto.randomUUID();

    const { data, error } = await supabase
      .from('esignature_requests')
      .insert({
        organization_id: this.orgId,
        token,
        document_title: opts.documentTitle,
        signer_name: opts.signerName,
        signer_email: opts.signerEmail,
        document_url: opts.documentUrl ?? null,
        status: 'pending',
      })
      .select('id')
      .single();

    if (error || !data) {
      log.error('[ESign] Failed to create request:', {}, error);
      throw new Error('Failed to create signature request');
    }

    const signingUrl = `/portal/${this.orgSlug}/sign/${token}`;

    return {
      requestId: data.id,
      signingUrl,
    };
  }

  async getStatus(requestId: string): Promise<ESignStatusResult> {
    const supabase = await createServiceClient();

    const { data, error } = await supabase
      .from('esignature_requests')
      .select('status, signed_at')
      .eq('id', requestId)
      .single();

    if (error || !data) {
      log.error('[ESign] Failed to get status:', {}, error);
      throw new Error('Signature request not found');
    }

    return {
      status: data.status as string,
      signedAt: (data.signed_at as string) ?? undefined,
    };
  }
}
