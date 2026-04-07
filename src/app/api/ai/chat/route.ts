/**
 * AI Chat API — streaming Claude responses with tool-use.
 *
 * Replaces the legacy regex-intent detection system with full
 * Vercel AI SDK streaming and Anthropic tool-use integration.
 *
 * @module app/api/ai/chat/route
 */

import { streamText, stepCountIs, convertToModelMessages, type ToolSet } from 'ai';
import { createClient } from '@/lib/supabase/server';
import { requireFeature } from '@/lib/api/tier-guard';
import { requirePermission } from '@/lib/api/permission-guard';
import { getCopilotModel, isAiConfigured } from '@/lib/ai/client';
import { buildSystemPrompt } from '@/lib/ai/prompts';
import { gatherContext } from '@/lib/ai/context';
import { buildCopilotTools } from '@/lib/ai/tools';
import { createLogger } from '@/lib/logger';

const log = createLogger('api-ai-chat');

export const maxDuration = 60; // Allow longer streaming responses

export async function POST(request: Request) {
  try {
    // ── Gate: tier + permission ───────────────────────────────
    const tierError = await requireFeature('ai_assistant');
    if (tierError) return tierError;

    const permError = await requirePermission('ai_assistant', 'view');
    if (permError) return permError;

    // ── Gate: API key configured ─────────────────────────────
    if (!isAiConfigured()) {
      return Response.json(
        {
          error: 'AI assistant is not configured. Please add ANTHROPIC_API_KEY to your environment.',
        },
        { status: 503 }
      );
    }

    // ── Auth ─────────────────────────────────────────────────
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── Parse request ────────────────────────────────────────
    const body = await request.json();
    const { messages, context: clientContext } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // ── Gather context ───────────────────────────────────────
    const aiContext = await gatherContext(supabase, user.id, {
      currentPage: clientContext?.currentPage,
      entityContext: clientContext?.entityContext,
    });

    if (!aiContext.organizationId) {
      return Response.json(
        { error: 'No organization found for user' },
        { status: 400 }
      );
    }

    // ── Build system prompt + tools ──────────────────────────
    const systemPrompt = buildSystemPrompt(aiContext);
    const tools = buildCopilotTools(supabase, aiContext.organizationId);

    // ── Stream response ──────────────────────────────────────
    const result = streamText({
      model: getCopilotModel(),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      tools,
      stopWhen: stepCountIs(5), // Allow up to 5 tool-use rounds
      temperature: 0.3, // Low temp for data queries, slightly creative for drafting
      onError: (error) => {
        log.error('AI stream error', {}, error);
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    log.error('AI chat route error', {}, error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
