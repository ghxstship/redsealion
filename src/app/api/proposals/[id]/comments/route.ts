import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { notifyCommentPosted } from '@/lib/notifications/triggers';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Try org-member permission first
  const perm = await checkPermission('proposals', 'view');
  if (perm?.allowed) {
    const supabase = await createClient();
    const { data: comments, error } = await supabase
      .from('proposal_comments')
      .select('*, author:users!author_id(full_name, avatar_url)')
      .eq('proposal_id', id)
      .order('created_at', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data: comments ?? [] });
  }

  // Fallback: portal client access via client_contacts
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify user's email is a client_contact for this proposal's client
  const serviceClient = await createServiceClient();
  const { data: proposal } = await serviceClient
    .from('proposals')
    .select('id, client_id, organization_id')
    .eq('id', id)
    .single();

  if (!proposal) return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });

  const { data: contact } = await serviceClient
    .from('client_contacts')
    .select('id')
    .eq('email', user.email ?? '')
    .eq('client_id', proposal.client_id)
    .limit(1)
    .maybeSingle();

  if (!contact) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Fetch non-internal comments only for portal users
  const { data: comments, error } = await serviceClient
    .from('proposal_comments')
    .select('*, author:users!author_id(full_name, avatar_url)')
    .eq('proposal_id', id)
    .eq('is_internal', false)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: comments ?? [] });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Try org-member permission first
  const perm = await checkPermission('proposals', 'edit');
  if (perm?.allowed) {
    const supabase = await createClient();
    const { data: proposal } = await supabase
      .from('proposals')
      .select('id, organization_id')
      .eq('id', id)
      .eq('organization_id', perm.organizationId)
      .single();

    if (!proposal) return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });

    const body = await request.json();
    const commentBody = (body.body ?? '').trim();
    if (!commentBody) return NextResponse.json({ error: 'Comment body is required' }, { status: 400 });

    const { data: comment, error } = await supabase
      .from('proposal_comments')
      .insert({
        proposal_id: id,
        author_id: perm.userId,
        body: commentBody,
        phase_id: body.phase_id || null,
        deliverable_id: body.deliverable_id || null,
        is_internal: body.is_internal ?? false,
      })
      .select('*, author:users!author_id(full_name, avatar_url)')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (comment) {
      notifyCommentPosted(comment.id as string, id, perm.organizationId).catch(() => {});
    }

    return NextResponse.json({ data: comment }, { status: 201 });
  }

  // Fallback: portal client posting
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const serviceClient = await createServiceClient();
  const { data: proposal } = await serviceClient
    .from('proposals')
    .select('id, client_id, organization_id')
    .eq('id', id)
    .single();

  if (!proposal) return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });

  const { data: contact } = await serviceClient
    .from('client_contacts')
    .select('id, first_name, last_name')
    .eq('email', user.email ?? '')
    .eq('client_id', proposal.client_id)
    .limit(1)
    .maybeSingle();

  if (!contact) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const commentBody = (body.body ?? '').trim();
  if (!commentBody) return NextResponse.json({ error: 'Comment body is required' }, { status: 400 });

  // Ensure portal user has a users table entry (M-12 fix)
  const authorId = user.id;
  const { data: existingUser } = await serviceClient
    .from('users')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (!existingUser) {
    const fullName = [contact.first_name, contact.last_name].filter(Boolean).join(' ') || user.email;
    await serviceClient
      .from('users')
      .insert({
        id: user.id,
        email: user.email,
        full_name: fullName,
        role: 'client',
      })
      .select('id')
      .single();
  }

  const { data: comment, error } = await serviceClient
    .from('proposal_comments')
    .insert({
      proposal_id: id,
      author_id: authorId,
      body: commentBody,
      phase_id: body.phase_id || null,
      deliverable_id: body.deliverable_id || null,
      is_internal: false, // Portal users can never post internal comments
    })
    .select('*, author:users!author_id(full_name, avatar_url)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (comment) {
    notifyCommentPosted(comment.id as string, id, proposal.organization_id).catch(() => {});
  }

  return NextResponse.json({ data: comment }, { status: 201 });
}
