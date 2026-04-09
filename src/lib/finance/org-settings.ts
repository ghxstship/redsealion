import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';

/**
 * Resolve the organization's preferred currency.
 * Falls back to 'USD' if not configured or on error.
 */
export async function getOrgCurrency(): Promise<string> {
  try {
    const ctx = await resolveCurrentOrg();
    if (!ctx) return 'USD';

    const supabase = await createClient();
    const { data: org } = await supabase
      .from('organizations')
      .select('settings')
      .eq('id', ctx.organizationId)
      .single();

    if (!org) return 'USD';

    const settings = (org.settings ?? {}) as Record<string, unknown>;
    return (settings.default_currency as string) || 'USD';
  } catch {
    return 'USD';
  }
}

/**
 * Resolve all org-level finance settings in one call.
 */
export async function getOrgFinanceSettings(): Promise<{
  currency: string;
  mileageRate: number;
  taxLabel: string;
  paymentTermsDays: number;
}> {
  const defaults = {
    currency: 'USD',
    mileageRate: 0.70,
    taxLabel: 'Tax',
    paymentTermsDays: 30,
  };

  try {
    const ctx = await resolveCurrentOrg();
    if (!ctx) return defaults;

    const supabase = await createClient();
    const { data: org } = await supabase
      .from('organizations')
      .select('settings, mileage_rate, tax_label')
      .eq('id', ctx.organizationId)
      .single();

    if (!org) return defaults;

    const settings = (org.settings ?? {}) as Record<string, unknown>;

    return {
      currency: (settings.default_currency as string) || 'USD',
      mileageRate: (org.mileage_rate as number) ?? 0.70,
      taxLabel: (org.tax_label as string) ?? 'Tax',
      paymentTermsDays: (settings.payment_terms_days as number) ?? 30,
    };
  } catch {
    return defaults;
  }
}
