/**
 * AI Conversation Feedback API — stores thumbs up/down on responses.
 *
 * POST /api/ai/chat/feedback — submit feedback for a message
 *
 * @module app/api/ai/chat/feedback/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireFeature } from '@/lib/api/tier-guard';
import { requirePermission } from '@/lib/api/permission-guard';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { createLogger } from '@/lib/logger';

const log = createLogger('api-ai-feedback');

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
    const { conversation_id, message_index, rating, comment } = body;

    if (!conversation_id || message_index === undefined || !rating) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['positive', 'negative'].includes(rating)) {
      return NextResponse.json({ error: 'Rating must be positive or negative' }, { status: 400 });
    }

    const { error } = await supabase.from('ai_conversation_feedback').insert({
      organization_id: ctx.organizationId,
      user_id: user.id,
      conversation_id,
      message_index,
      rating,
      comment: comment || null,
    });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error('Submit feedback error', {}, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
