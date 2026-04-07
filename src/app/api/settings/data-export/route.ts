import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { serveRateLimit } from '@/lib/api/rate-limit';
import { logAuditAction } from '@/lib/api/audit-logger';

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  const { success } = await serveRateLimit(`export_${ip}`, 2, 60000 * 5); // 2 exports per 5 minutes
  if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

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
    supabase.from('organization_memberships').select('user_id, users!user_id(id, first_name, last_name, email, title, phone, created_at), roles(name)').eq('organization_id', orgId).eq('status', 'active'),
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

  // Log this sensitive action
  await logAuditAction({
    orgId,
    action: 'DATA_EXPORT_GENERATED',
    entity: 'organization',
    entityId: orgId,
    metadata: {
      tables: ['proposals', 'invoices', 'clients', 'assets', 'users', 'tags', 'crew'],
      recordCounts: {
        proposals: proposals?.length || 0,
        invoices: invoices?.length || 0,
        clients: clients?.length || 0,
      }
    }
  });

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="data-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
