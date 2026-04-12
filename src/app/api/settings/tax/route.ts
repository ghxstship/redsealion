import { NextRequest, NextResponse } from 'next/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { createClient } from '@/lib/supabase/server';

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const perm = await checkPermission('settings', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { default_tax_rate, tax_label } = body as {
    default_tax_rate?: number;
    tax_label?: string;
  };

  const updates: Record<string, unknown> = {};
  if (default_tax_rate !== undefined) {
    updates.default_tax_rate = Math.max(0, Math.min(100, default_tax_rate));
  }
  if (tax_label !== undefined) {
    updates.tax_label = tax_label.trim() || 'Tax';
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update.' }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('organizations')
    .update(updates)
    .eq('id', perm.organizationId);

  if (error) {
    return NextResponse.json({ error: 'Failed to save tax settings.', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
