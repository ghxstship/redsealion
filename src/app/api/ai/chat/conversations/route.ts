/**
 * AI Conversation CRUD API — list, load, and delete conversations.
 *
 * GET  /api/ai/chat/conversations       — list user's conversations
 * POST /api/ai/chat/conversations       — save/update a conversation
 * GET  /api/ai/chat/conversations/[id]  — load a specific conversation
 * DELETE /api/ai/chat/conversations/[id] — soft-delete a conversation
 *
 * @module app/api/ai/chat/conversations/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireFeature } from '@/lib/api/tier-guard';
import { requirePermission } from '@/lib/api/permission-guard';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { createLogger } from '@/lib/logger';

const log = createLogger('api-ai-conversations');

/**
 * GET — List conversations for the current user.
 */
export async function GET() {
  try {
    const tierError = await requireFeature('ai_assistant');
    if (tierError) return tierError;

    const permError = await requirePermission('ai_assistant', 'view');
    if (permError) return permError;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const ctx = await resolveCurrentOrg();
    if (!ctx) return NextResponse.json({ error: 'No organization' }, { status: 400 });

    const { data, error } = await supabase
      .from('ai_conversations')
      .select('id, title, status, model, total_input_tokens, total_output_tokens, estimated_cost_usd, created_at, updated_at')
      .eq('organization_id', ctx.organizationId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    return NextResponse.json({ conversations: data ?? [] });
  } catch (error) {
    log.error('List conversations error', {}, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST — Save or update a conversation.
 */
export async function POST(request: NextRequest) {
  try {
    const tierError = await requireFeature('ai_assistant');
    if (tierError) return tierError;

    const permError = await requirePermission('ai_assistant', 'view');
    if (permError) return permError;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const ctx = await resolveCurrentOrg();
    if (!ctx) return NextResponse.json({ error: 'No organization' }, { status: 400 });

    const body = await request.json();
    const { id, title, messages, context, model, status } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    if (id) {
      // Update existing conversation
      const { data, error } = await supabase
        .from('ai_conversations')
        .update({
          title: title ?? null,
          messages,
          context: context ?? null,
          model: model ?? 'claude-sonnet-4-20250514',
          status: status ?? 'active',
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .eq('organization_id', ctx.organizationId)
        .select('id')
        .single();

      if (error) throw error;
      return NextResponse.json({ id: data.id });
    } else {
      // Create new conversation
      const { data, error } = await supabase
        .from('ai_conversations')
        .insert({
          organization_id: ctx.organizationId,
          user_id: user.id,
          title: title ?? null,
          messages,
          context: context ?? null,
          model: model ?? 'claude-sonnet-4-20250514',
          status: 'active',
        })
        .select('id')
        .single();

      if (error) throw error;
      return NextResponse.json({ id: data.id }, { status: 201 });
    }
  } catch (error) {
    log.error('Save conversation error', {}, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
