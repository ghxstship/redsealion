/**
 * Server-side data fetching and types for the client detail page.
 *
 * @module app/app/clients/[id]/_data
 */

import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { formatLabel } from '@/lib/utils';

/* ─── Types ─────────────────────────────────────────────── */

export interface ClientDetail {
  company_name: string;
  industry: string | null;
  tags: string[];
  billing_address: string;
  status: string;
  source: string | null;
  website: string | null;
  linkedin: string | null;
  annual_revenue: number | null;
  employee_count: number | null;
  notes: string | null;
  contacts: Array<{
    id: string;
    name: string;
    title: string;
    email: string;
    phone: string;
    role: string;
    is_decision_maker: boolean;
  }>;
  proposals: Array<{
    id: string;
    name: string;
    status: string;
    total_value: number;
    prepared_date: string;
  }>;
  deals: Array<{
    id: string;
    title: string;
    value: number;
    stage: string;
  }>;
  interactions: Array<{
    id: string;
    type: string;
    subject: string;
    body: string | null;
    occurred_at: string;
  }>;
  activity: Array<{
    id: string;
    action: string;
    detail: string;
    date: string;
  }>;
}

/* ─── Fallback Data ─────────────────────────────────────── */

const defaultClient: ClientDetail = {
  company_name: 'Unknown Client',
  industry: null,
  tags: [],
  billing_address: '',
  status: 'active',
  source: null,
  website: null,
  linkedin: null,
  annual_revenue: null,
  employee_count: null,
  notes: null,
  contacts: [],
  proposals: [],
  deals: [],
  interactions: [],
  activity: [],
};

/* ─── Data Fetcher ──────────────────────────────────────── */

export async function getClient(id: string): Promise<ClientDetail> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) throw new Error('No org context');

    const { data: client } = await supabase
      .from('clients')
      .select()
      .eq('id', id)
      .eq('organization_id', ctx.organizationId)
      .is('deleted_at', null)
      .single();

    if (!client) throw new Error('Not found');

    const { data: contacts } = await supabase
      .from('client_contacts')
      .select()
      .eq('client_id', id)
      .is('deleted_at', null);

    const { data: proposals } = await supabase
      .from('proposals')
      .select('id, name, status, total_value, prepared_date')
      .eq('client_id', id);

    const { data: deals } = await supabase
      .from('deals')
      .select('id, title, value, stage')
      .eq('client_id', id);

    const { data: interactions } = await supabase
      .from('client_interactions')
      .select('id, type, subject, body, occurred_at')
      .eq('client_id', id)
      .order('occurred_at', { ascending: false });

    const addr = client.billing_address as Record<string, string> | null;
    const addrStr = addr
      ? [addr.street, addr.city, addr.state, addr.zip].filter(Boolean).join(', ')
      : '';

    // H-05: Build real activity feed from deal_activities for this client
    const dealIds = (deals ?? []).map((d: Record<string, unknown>) => d.id as string);
    let activityData: Array<Record<string, unknown>> = [];
    if (dealIds.length > 0) {
      const { data: feed } = await supabase
        .from('deal_activities')
        .select('id, type, description, created_at')
        .in('deal_id', dealIds)
        .order('created_at', { ascending: false })
        .limit(30);
      activityData = (feed ?? []) as Array<Record<string, unknown>>;
    }

    // #36: Also include client_interactions in activity feed
    const interactionActivity = (interactions ?? []).map((i: Record<string, unknown>) => ({
      id: `int-${i.id}`,
      type: i.type as string,
      description: i.subject as string,
      created_at: i.occurred_at as string,
    }));
    activityData = [...activityData, ...interactionActivity]
      .sort((a, b) => new Date(b.created_at as string).getTime() - new Date(a.created_at as string).getTime())
      .slice(0, 30);

    return {
      company_name: client.company_name,
      industry: client.industry,
      tags: client.tags ?? [],
      billing_address: addrStr,
      status: client.status ?? 'active',
      source: client.source,
      website: client.website ?? null,
      linkedin: client.linkedin ?? null,
      annual_revenue: client.annual_revenue ?? null,
      employee_count: client.employee_count ?? null,
      notes: client.notes ?? null,
      contacts: (contacts ?? []).map((c: Record<string, unknown>) => ({
        id: c.id as string,
        name: `${c.first_name} ${c.last_name}`,
        title: (c.title as string) ?? '',
        email: c.email as string,
        phone: (c.phone as string) ?? '',
        role: c.role as string,
        is_decision_maker: c.is_decision_maker as boolean,
      })),
      proposals: (proposals ?? []).map((p: Record<string, unknown>) => ({
        id: p.id as string,
        name: p.name as string,
        status: p.status as string,
        total_value: p.total_value as number,
        prepared_date: p.prepared_date as string,
      })),
      deals: (deals ?? []).map((d: Record<string, unknown>) => ({
        id: d.id as string,
        title: d.title as string,
        value: d.value as number,
        stage: d.stage as string,
      })),
      interactions: (interactions ?? []).map((i: Record<string, unknown>) => ({
        id: i.id as string,
        type: i.type as string,
        subject: i.subject as string,
        body: (i.body as string) ?? null,
        occurred_at: i.occurred_at as string,
      })),
      activity: activityData.map((a) => ({
        id: a.id as string,
        action: a.type as string,
        detail: (a.description as string) ?? '',
        date: a.created_at as string,
      })),
    };
  } catch {
    return defaultClient;
  }
}

/* ─── Helpers ───────────────────────────────────────────── */

export function formatStatus(status: string): string {
  return formatLabel(status);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export { roleLabel } from '@/lib/clients/contact-roles';
