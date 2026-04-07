import { NextRequest, NextResponse } from 'next/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { createClient } from '@/lib/supabase/server';

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

  const supabase = await createClient();
  const orgId = perm.organizationId;

  let query = supabase
    .from('leads')
    .select()
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data: leads, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch leads.', details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ leads: leads ?? [] });
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

  const { data: lead, error } = await supabase
    .from('leads')
    .insert({
      organization_id: orgId,
      source: source || null,
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
    })
    .select()
    .single();

  if (error || !lead) {
    return NextResponse.json(
      { error: 'Failed to create lead.', details: error?.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, lead });
}
