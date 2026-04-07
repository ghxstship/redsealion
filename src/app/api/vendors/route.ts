import { NextRequest, NextResponse } from 'next/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const perm = await checkPermission('settings', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createClient();
  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const search = url.searchParams.get('search');

  let query = supabase
    .from('vendors')
    .select('*')
    .eq('organization_id', perm.organizationId)
    .order('name');

  if (status) query = query.eq('status', status);
  if (search) query = query.ilike('name', `%${search}%`);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: 'Failed to fetch vendors.', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ vendors: data ?? [] });
}

export async function POST(request: NextRequest) {
  const perm = await checkPermission('settings', 'create');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const {
    name,
    display_name,
    email,
    phone,
    website,
    address,
    payment_terms,
    tax_id,
    currency,
    category,
    tags,
    notes,
  } = body as {
    name?: string;
    display_name?: string;
    email?: string;
    phone?: string;
    website?: string;
    address?: Record<string, unknown>;
    payment_terms?: string;
    tax_id?: string;
    currency?: string;
    category?: string;
    tags?: string[];
    notes?: string;
  };

  if (!name) {
    return NextResponse.json({ error: 'Vendor name is required.' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('vendors')
    .insert({
      organization_id: perm.organizationId,
      name,
      display_name: display_name || null,
      email: email || null,
      phone: phone || null,
      website: website || null,
      address: address || {},
      payment_terms: payment_terms || 'net_30',
      tax_id: tax_id || null,
      currency: currency || 'USD',
      category: category || null,
      tags: tags || [],
      notes: notes || null,
    })
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Failed to create vendor.', details: error?.message }, { status: 500 });
  }

  return NextResponse.json({ vendor: data });
}
