import { NextRequest, NextResponse } from 'next/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { createClient } from '@/lib/supabase/server';
import { dispatchWebhookEvent } from '@/lib/webhooks/outbound';
import { computeLeadScore } from '@/lib/leads/lead-scoring';

export async function GET(request: NextRequest) {
  const perm = await checkPermission('leads', 'view');
  if (!perm) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!perm.allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const email = url.searchParams.get('email');
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get('pageSize') || '50', 10)));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = await createClient();
  const orgId = perm.organizationId;

  let query = supabase
    .from('leads')
    .select('*, users!leads_assigned_to_fkey(id, full_name, avatar_url)', { count: 'exact' })
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (status) {
    query = query.eq('status', status);
  }
  if (email) {
    query = query.eq('contact_email', email);
  }

  const { data: leads, error, count } = await query;

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch leads.', details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ leads: leads ?? [], total: count ?? 0, page, pageSize });
}

export async function POST(request: NextRequest) {
  const perm = await checkPermission('leads', 'create');
  if (!perm) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!perm.allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const {
    source,
    company_name,
    contact_first_name,
    contact_last_name,
    contact_email,
    contact_phone,
    event_type,
    event_date,
    estimated_budget,
    message,
  } = body as {
    source?: string;
    company_name?: string;
    contact_first_name?: string;
    contact_last_name?: string;
    contact_email?: string;
    contact_phone?: string;
    event_type?: string;
    event_date?: string;
    estimated_budget?: number;
    message?: string;
  };

  if (!contact_first_name) {
    return NextResponse.json(
      { error: 'contact_first_name is required.' },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const orgId = perm.organizationId;

  // Compute lead score before insert
  const scoreInput = {
    contact_email: contact_email || null,
    contact_phone: contact_phone || null,
    estimated_budget: estimated_budget ?? null,
    source: source || 'Manual',
    status: 'new',
    created_at: new Date().toISOString(),
    company_name: company_name || null,
    message: message || null,
  };
  const { score, tier } = computeLeadScore(scoreInput);

  const { data: lead, error } = await supabase
    .from('leads')
    .insert({
      organization_id: orgId,
      source: source || 'Manual',
      company_name: company_name || null,
      contact_first_name,
      contact_last_name: contact_last_name || '',
      contact_email: contact_email || null,
      contact_phone: contact_phone || null,
      event_type: event_type || null,
      event_date: event_date || null,
      estimated_budget: estimated_budget ?? null,
      message: message || null,
      status: 'new',
      score,
      score_tier: tier,
      created_by: perm.userId ?? null,
    })
    .select()
    .single();

  if (error || !lead) {
    return NextResponse.json(
      { error: 'Failed to create lead.', details: error?.message },
      { status: 500 },
    );
  }

  // Dispatch webhook event
  dispatchWebhookEvent(orgId, 'lead.created', { lead }).catch(() => {});

  return NextResponse.json({ success: true, lead });
}
