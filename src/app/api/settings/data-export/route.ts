import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

export async function POST() {
  const perm = await checkPermission('settings', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createClient();
  const orgId = perm.organizationId;

  // Fetch all org data in parallel
  const [
    { data: proposals },
    { data: invoices },
    { data: clients },
    { data: equipment },
    { data: users },
    { data: tags },
    { data: crew },
  ] = await Promise.all([
    supabase.from('proposals').select('*').eq('organization_id', orgId),
    supabase.from('invoices').select('*').eq('organization_id', orgId),
    supabase.from('clients').select('*').eq('organization_id', orgId),
    supabase.from('assets').select('*').eq('organization_id', orgId),
    supabase.from('users').select('id, full_name, email, role, title, phone, created_at').eq('organization_id', orgId),
    supabase.from('tags').select('*').eq('organization_id', orgId),
    supabase.from('crew_profiles').select('*').eq('organization_id', orgId),
  ]);

  const exportData = {
    exported_at: new Date().toISOString(),
    organization_id: orgId,
    proposals: proposals ?? [],
    invoices: invoices ?? [],
    clients: clients ?? [],
    equipment: equipment ?? [],
    users: users ?? [],
    tags: tags ?? [],
    crew: crew ?? [],
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="data-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
