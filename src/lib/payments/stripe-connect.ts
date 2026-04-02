const STRIPE_API_BASE = 'https://api.stripe.com/v1';

function getApiKey(): string | null {
  return process.env.STRIPE_SECRET_KEY ?? null;
}

function authHeaders(apiKey: string, stripeAccount?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  };
  if (stripeAccount) {
    headers['Stripe-Account'] = stripeAccount;
  }
  return headers;
}

/**
 * Create a Stripe Connect Standard account.
 * Returns the account object or null if Stripe is not configured.
 */
export async function createConnectAccount(
  orgId: string,
  orgName: string,
  email: string,
): Promise<{ id: string; type: string } | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const body = new URLSearchParams({
    'type': 'standard',
    'email': email,
    'business_profile[name]': orgName,
    'metadata[org_id]': orgId,
  });

  const res = await fetch(`${STRIPE_API_BASE}/accounts`, {
    method: 'POST',
    headers: authHeaders(apiKey),
    body: body.toString(),
  });

  if (!res.ok) return null;
  const data = await res.json();

  return { id: data.id, type: data.type };
}

/**
 * Create an Account Link for Stripe Connect onboarding.
 * Returns the onboarding URL or null if Stripe is not configured.
 */
export async function createAccountLink(
  accountId: string,
  returnUrl: string,
  refreshUrl: string,
): Promise<{ url: string } | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const body = new URLSearchParams({
    'account': accountId,
    'return_url': returnUrl,
    'refresh_url': refreshUrl,
    'type': 'account_onboarding',
  });

  const res = await fetch(`${STRIPE_API_BASE}/account_links`, {
    method: 'POST',
    headers: authHeaders(apiKey),
    body: body.toString(),
  });

  if (!res.ok) return null;
  const data = await res.json();

  return { url: data.url };
}

/**
 * Retrieve the status of a Stripe Connect account.
 * Returns charges_enabled, payouts_enabled, details_submitted or null.
 */
export async function getAccountStatus(
  accountId: string,
): Promise<{
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
} | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const res = await fetch(`${STRIPE_API_BASE}/accounts/${accountId}`, {
    method: 'GET',
    headers: authHeaders(apiKey),
  });

  if (!res.ok) return null;
  const data = await res.json();

  return {
    charges_enabled: data.charges_enabled,
    payouts_enabled: data.payouts_enabled,
    details_submitted: data.details_submitted,
  };
}
