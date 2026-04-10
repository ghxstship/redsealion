/**
 * AI Conversation detail API — load and delete individual conversations.
 *
 * GET    /api/ai/chat/conversations/[id] — load conversation
 * DELETE /api/ai/chat/conversations/[id] — soft-delete conversation
 *
 * @module app/api/ai/chat/conversations/[id]/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireFeature } from '@/lib/api/tier-guard';
import { requirePermission } from '@/lib/api/permission-guard';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { createLogger } from '@/lib/logger';

const log = createLogger('api-ai-conversation-detail');

/**
 * GET — Load a specific conversation by ID.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tierError = await requireFeature('ai_assistant');
    if (tierError) return tierError;

    const permError = await requirePermission('ai_assistant', 'view');
    if (permError) return permError;

    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const ctx = await resolveCurrentOrg();
    if (!ctx) return NextResponse.json({ error: 'No organization' }, { status: 400 });

    const { data, error } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('id', id)
      .eq('organization_id', ctx.organizationId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    return NextResponse.json({ conversation: data });
  } catch (error) {
    log.error('Load conversation error', {}, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE — Soft-delete a conversation.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tierError = await requireFeature('ai_assistant');
    if (tierError) return tierError;

    const permError = await requirePermission('ai_assistant', 'view');
    if (permError) return permError;

    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const ctx = await resolveCurrentOrg();
    if (!ctx) return NextResponse.json({ error: 'No organization' }, { status: 400 });

    const { error } = await supabase
      .from('ai_conversations')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('organization_id', ctx.organizationId)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error('Delete conversation error', {}, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
