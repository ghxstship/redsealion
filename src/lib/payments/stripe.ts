const STRIPE_API_BASE = 'https://api.stripe.com/v1';

/**
 * Create a Stripe Payment Link for an invoice.
 * Returns null if no STRIPE_SECRET_KEY is configured.
 */
export async function createPaymentLink(opts: {
  invoiceId: string;
  amount: number;
  currency: string;
  description: string;
  stripeAccountId?: string;
}): Promise<{ url: string; externalId: string } | null> {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) return null;

  const baseHeaders: Record<string, string> = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  if (opts.stripeAccountId) {
    baseHeaders['Stripe-Account'] = opts.stripeAccountId;
  }

  // First create a price for the one-off amount
  const priceBody = new URLSearchParams({
    'unit_amount': String(Math.round(opts.amount * 100)),
    'currency': opts.currency.toLowerCase(),
    'product_data[name]': opts.description,
  });

  const priceRes = await fetch(`${STRIPE_API_BASE}/prices`, {
    method: 'POST',
    headers: baseHeaders,
    body: priceBody.toString(),
  });

  if (!priceRes.ok) return null;
  const priceData = await priceRes.json();

  // Create the payment link
  const linkBody = new URLSearchParams({
    'line_items[0][price]': priceData.id,
    'line_items[0][quantity]': '1',
    'metadata[invoice_id]': opts.invoiceId,
  });

  const linkRes = await fetch(`${STRIPE_API_BASE}/payment_links`, {
    method: 'POST',
    headers: baseHeaders,
    body: linkBody.toString(),
  });

  if (!linkRes.ok) return null;
  const linkData = await linkRes.json();

  return {
    url: linkData.url,
    externalId: linkData.id,
  };
}

/**
 * Verify and parse a Stripe webhook event.
 * Uses HMAC-SHA256 signature verification with STRIPE_WEBHOOK_SECRET.
 * Returns null if verification fails or no secret is configured.
 */
export async function handleWebhookEvent(
  payload: string,
  signature: string,
): Promise<{ event: string; data: Record<string, unknown> } | null> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return null;

  // Parse the Stripe-Signature header
  const parts = signature.split(',').reduce(
    (acc, part) => {
      const [key, value] = part.split('=');
      if (key === 't') acc.timestamp = value;
      if (key === 'v1') acc.signatures.push(value);
      return acc;
    },
    { timestamp: '', signatures: [] as string[] },
  );

  if (!parts.timestamp || parts.signatures.length === 0) return null;

  // Compute expected signature
  const signedPayload = `${parts.timestamp}.${payload}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(signedPayload));
  const expectedSig = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  // Constant-time-ish comparison
  const isValid = parts.signatures.some((s) => s === expectedSig);
  if (!isValid) return null;

  const body = JSON.parse(payload);
  return {
    event: body.type,
    data: body.data?.object ?? {},
  };
}
