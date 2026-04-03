import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

export async function GET(request: NextRequest) {
  const perm = await checkPermission('clients', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createClient();
  const url = new URL(request.url);
  const search = url.searchParams.get('search');

  let query = supabase
    .from('clients')
    .select('*, client_contacts(*)')
    .eq('organization_id', perm.organizationId)
    .order('company_name', { ascending: true });

  if (search) query = query.ilike('company_name', `%${search}%`);

  const { data: clients, error } = await query;
  if (error) return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });

  return NextResponse.json({ clients: clients ?? [] });
}

export async function POST(request: NextRequest) {
  const perm = await checkPermission('clients', 'create');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { company_name, industry, billing_address, tags, source, website, linkedin, notes, contacts } = body as {
    company_name?: string; industry?: string; billing_address?: Record<string, unknown>;
    tags?: string[]; source?: string; website?: string; linkedin?: string; notes?: string;
    contacts?: Array<{ first_name: string; last_name: string; email: string; title?: string; phone?: string; role?: string }>;
  };

  if (!company_name) return NextResponse.json({ error: 'company_name is required' }, { status: 400 });

  const supabase = await createClient();

  const { data: client, error } = await supabase
    .from('clients')
    .insert({
      organization_id: perm.organizationId,
      company_name,
      industry: industry ?? null,
      billing_address: billing_address ?? null,
      tags: tags ?? [],
      source: source ?? null,
      website: website ?? null,
      linkedin: linkedin ?? null,
      notes: notes ?? null,
    })
    .select()
    .single();

  if (error || !client) {
    return NextResponse.json({ error: 'Failed to create client', details: error?.message }, { status: 500 });
  }

  // Insert contacts if provided
  if (contacts && contacts.length > 0) {
    const contactRows = contacts.map((c) => ({
      client_id: client.id,
      first_name: c.first_name,
      last_name: c.last_name,
      email: c.email,
      title: c.title ?? null,
      phone: c.phone ?? null,
      role: c.role ?? 'primary',
      is_decision_maker: false,
      is_signatory: false,
    }));
    await supabase.from('client_contacts').insert(contactRows);
  }

  return NextResponse.json({ success: true, client }, { status: 201 });
}
