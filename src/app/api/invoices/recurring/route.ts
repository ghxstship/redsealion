import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

export async function GET() {
  const perm = await checkPermission('invoices', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('recurring_invoice_schedules')
    .select('*, clients(company_name)')
    .eq('organization_id', perm.organizationId)
    .order('next_issue_date');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: NextRequest) {
  const perm = await checkPermission('invoices', 'create');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { client_id, frequency, next_issue_date, end_date, template_data } = body as {
    client_id?: string;
    frequency?: string;
    next_issue_date?: string;
    end_date?: string;
    template_data?: Record<string, unknown>;
  };

  if (!client_id || !frequency || !next_issue_date) {
    return NextResponse.json({ error: 'client_id, frequency, and next_issue_date are required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('recurring_invoice_schedules')
    .insert({
      organization_id: perm.organizationId,
      client_id,
      frequency,
      next_issue_date,
      end_date: end_date || null,
      template_data: template_data || {},
      is_active: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
