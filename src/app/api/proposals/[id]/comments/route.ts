import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: comments, error } = await supabase
      .from('proposal_comments')
      .select('*, author:users!author_id(full_name, avatar_url)')
      .eq('proposal_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: comments ?? [] });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has access to this proposal (belongs to their org)
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { data: proposal } = await supabase
      .from('proposals')
      .select('id, organization_id')
      .eq('id', id)
      .eq('organization_id', userData.organization_id)
      .single();

    if (!proposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 },
      );
    }

    const body = await request.json();
    const commentBody = (body.body ?? '').trim();

    if (!commentBody) {
      return NextResponse.json(
        { error: 'Comment body is required' },
        { status: 400 },
      );
    }

    const { data: comment, error } = await supabase
      .from('proposal_comments')
      .insert({
        proposal_id: id,
        author_id: user.id,
        body: commentBody,
        phase_id: body.phase_id || null,
        deliverable_id: body.deliverable_id || null,
        is_internal: body.is_internal ?? false,
      })
      .select('*, author:users!author_id(full_name, avatar_url)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: comment }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
