import { NextRequest, NextResponse } from 'next/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { convertLeadToProject } from '@/lib/leads/conversion';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const perm = await checkPermission('leads', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const orgId = perm.organizationId;

  // Verify the lead exists and belongs to this org
  const supabase = await createClient();
  const { data: lead, error: fetchError } = await supabase
    .from('leads')
    .select('id, status, converted_to_deal_id')
    .eq('id', id)
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .single();

  if (fetchError || !lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  if (lead.status === 'converted' && lead.converted_to_deal_id) {
    return NextResponse.json(
      { error: 'Lead has already been converted', deal_id: lead.converted_to_deal_id },
      { status: 409 },
    );
  }

  const success = await convertLeadToProject(id, orgId);

  if (!success) {
    return NextResponse.json(
      { error: 'Conversion failed. Check server logs for details.' },
      { status: 500 },
    );
  }

  // Re-fetch the lead to get the conversion references
  const { data: updated } = await supabase
    .from('leads')
    .select('id, status, converted_to_deal_id, converted_to_client_id, converted_to_contact_id')
    .eq('id', id)
    .single();

  return NextResponse.json({
    success: true,
    lead: updated,
  });
}
