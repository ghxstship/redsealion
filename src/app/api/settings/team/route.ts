import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

export async function GET() {
  const perm = await checkPermission('settings', 'view');
  if (!perm) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!perm.allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = await createClient();
  const orgId = perm.organizationId;

  const { data: members, error } = await supabase
    .from('users')
    .select('id, full_name, email, role, avatar_url, created_at')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 },
    );
  }

  return NextResponse.json({ members: members || [] });
}

export async function DELETE(request: NextRequest) {
  const perm = await checkPermission('settings', 'edit');
  if (!perm) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!perm.allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const memberId = searchParams.get('id');

  if (!memberId) {
    return NextResponse.json(
      { error: 'Member ID is required' },
      { status: 400 },
    );
  }

  // Prevent self-removal
  if (memberId === perm.userId) {
    return NextResponse.json(
      { error: 'You cannot remove yourself from the organization' },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const orgId = perm.organizationId;

  // Verify the member belongs to this org
  const { data: member } = await supabase
    .from('users')
    .select('id, organization_id')
    .eq('id', memberId)
    .eq('organization_id', orgId)
    .single();

  if (!member) {
    return NextResponse.json(
      { error: 'Member not found in this organization' },
      { status: 404 },
    );
  }

  const { error } = await supabase
    .from('users')
    .update({ organization_id: null, updated_at: new Date().toISOString() })
    .eq('id', memberId)
    .eq('organization_id', orgId);

  if (error) {
    return NextResponse.json(
      { error: 'Failed to remove member' },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
