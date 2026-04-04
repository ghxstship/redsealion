import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const STRIPE_API_BASE = 'https://api.stripe.com/v1';

/**
 * Stripe price IDs mapped to subscription tiers.
 * These should be created in the Stripe dashboard and stored as env vars.
 * If not configured, the checkout will gracefully fail with a descriptive error.
 */
const PRICE_MAP: Record<string, string | undefined> = {
  starter: process.env.STRIPE_PRICE_STARTER,
  professional: process.env.STRIPE_PRICE_PROFESSIONAL,
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE,
};

export async function POST(request: Request) {
  try {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Stripe is not configured. Please add STRIPE_SECRET_KEY.' },
        { status: 503 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the org's stripe_customer_id
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 },
      );
    }

    const { data: org } = await supabase
      .from('organizations')
      .select('id, stripe_customer_id, name')
      .eq('id', userData.organization_id)
      .single();

    if (!org) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 },
      );
    }

    const body = await request.json();
    const tier = body.tier as string;

    const priceId = PRICE_MAP[tier];
    if (!priceId) {
      return NextResponse.json(
        {
          error: `No Stripe price configured for the "${tier}" plan. Set STRIPE_PRICE_${tier.toUpperCase()} in your environment.`,
        },
        { status: 400 },
      );
    }

    // Create or reuse Stripe customer
    let stripeCustomerId = org.stripe_customer_id;

    if (!stripeCustomerId) {
      const customerBody = new URLSearchParams({
        'email': user.email ?? '',
        'name': org.name,
        'metadata[organization_id]': org.id,
        'metadata[supabase_user_id]': user.id,
      });

      const customerRes = await fetch(`${STRIPE_API_BASE}/customers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: customerBody.toString(),
      });

      if (!customerRes.ok) {
        return NextResponse.json(
          { error: 'Failed to create Stripe customer' },
          { status: 500 },
        );
      }

      const customerData = await customerRes.json();
      stripeCustomerId = customerData.id;

      // Persist customer ID to the org
      await supabase
        .from('organizations')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', org.id);
    }

    // Create checkout session
    const origin = request.headers.get('origin') ?? 'http://localhost:3000';

    const sessionBody = new URLSearchParams({
      'customer': stripeCustomerId as string,
      'mode': 'subscription',
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      'success_url': `${origin}/app/settings/billing?session_id={CHECKOUT_SESSION_ID}&success=true`,
      'cancel_url': `${origin}/app/settings/billing?cancelled=true`,
      'metadata[organization_id]': org.id,
      'metadata[tier]': tier,
      'subscription_data[metadata][organization_id]': org.id,
      'subscription_data[metadata][tier]': tier,
    });

    const sessionRes = await fetch(
      `${STRIPE_API_BASE}/checkout/sessions`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: sessionBody.toString(),
      },
    );

    if (!sessionRes.ok) {
      const err = await sessionRes.json();
      return NextResponse.json(
        { error: err.error?.message ?? 'Failed to create checkout session' },
        { status: 500 },
      );
    }

    const sessionData = await sessionRes.json();

    return NextResponse.json({ url: sessionData.url });
  } catch (error) {
    const { createLogger } = await import('@/lib/logger');
    createLogger('payments').error('Checkout session creation failed', {}, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
