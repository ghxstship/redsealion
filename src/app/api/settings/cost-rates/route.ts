import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

export async function GET() {
  const perm = await checkPermission('settings', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('cost_rates')
    .select()
    .eq('organization_id', perm.organizationId)
    .order('role');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: NextRequest) {
  const perm = await checkPermission('settings', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { role, hourly_cost, hourly_billable } = body as {
    role?: string;
    hourly_cost?: number;
    hourly_billable?: number;
  };

  if (!role || hourly_cost == null || hourly_billable == null) {
    return NextResponse.json({ error: 'role, hourly_cost, and hourly_billable are required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('cost_rates')
    .insert({
      organization_id: perm.organizationId,
      role,
      hourly_cost,
      hourly_billable,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
