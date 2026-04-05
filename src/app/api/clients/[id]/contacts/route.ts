import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: clientId } = await params;
  const perm = await checkPermission('clients', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createClient();
  const body = await request.json();

  const { data, error } = await supabase
    .from('client_contacts')
    .insert({
      client_id: clientId,
      first_name: body.first_name,
      last_name: body.last_name,
      email: body.email,
      phone: body.phone ?? null,
      title: body.title ?? null,
      is_primary: body.is_primary ?? false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: clientId } = await params;
  const perm = await checkPermission('clients', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('client_contacts')
    .select('*')
    .eq('client_id', clientId)
    .order('is_primary', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
