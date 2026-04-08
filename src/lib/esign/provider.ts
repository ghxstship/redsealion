/**
 * Abstract e-signature provider interface.
 *
 * All provider implementations must conform to this contract so the rest
 * of the application stays decoupled from any specific signing backend.
 */

export interface ESignCreateOptions {
  documentTitle: string;
  signerName: string;
  signerEmail: string;
  documentUrl?: string;
}

export interface ESignCreateResult {
  requestId: string;
  signingUrl: string;
}

export interface ESignStatusResult {
  status: string;
  signedAt?: string;
}

export interface ESignProvider {
  createRequest(opts: ESignCreateOptions): Promise<ESignCreateResult>;
  getStatus(requestId: string): Promise<ESignStatusResult>;
}

// Re-export the built-in implementation lazily to avoid circular deps
export async function getESignProvider(
  type: 'built-in',
  opts: { orgId: string; orgSlug: string },
): Promise<ESignProvider> {
  // Only built-in is supported for now; the parameter is here so we can
  // add DocuSign / HelloSign etc. later without changing call-sites.
  const { BuiltInESignProvider } = await import('./built-in');
  return new BuiltInESignProvider(opts.orgId, opts.orgSlug);
}
