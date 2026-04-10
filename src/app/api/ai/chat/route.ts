/**
 * AI Chat API — streaming Claude responses with tool-use.
 *
 * Uses Vercel AI SDK streaming with Anthropic tool-use integration.
 * Includes rate limiting, usage tracking, and audit logging.
 *
 * @module app/api/ai/chat/route
 */

import { streamText, stepCountIs, convertToModelMessages, type StepResult } from 'ai';
import { createClient } from '@/lib/supabase/server';
import { requireFeature } from '@/lib/api/tier-guard';
import { requirePermission } from '@/lib/api/permission-guard';
import { getCopilotModel, isAiConfigured } from '@/lib/ai/client';
import { buildSystemPrompt } from '@/lib/ai/prompts';
import { gatherContext } from '@/lib/ai/context';
import { buildCopilotTools } from '@/lib/ai/tools';
import { checkAiRateLimit } from '@/lib/ai/rate-limit';
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

    // ── Rate limiting (GAP-08) ───────────────────────────────
    const rateLimitError = checkAiRateLimit(user.id, aiContext.organizationId);
    if (rateLimitError) return rateLimitError;

    // ── Build system prompt + tools ──────────────────────────
    const systemPrompt = buildSystemPrompt(aiContext);
    const tools = buildCopilotTools(supabase, aiContext.organizationId);

    // ── Track timing ─────────────────────────────────────────
    const startTime = Date.now();

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
      onFinish: async ({ usage, steps }) => {
        // ── Usage tracking (GAP-09, GAP-25) ──────────────────
        try {
          const durationMs = Date.now() - startTime;
          const inputTokens = usage?.inputTokens ?? 0;
          const outputTokens = usage?.outputTokens ?? 0;
          // Approximate cost for Claude Sonnet 4 pricing
          const estimatedCost = (inputTokens * 3 + outputTokens * 15) / 1_000_000;
          const toolCallsCount = (steps ?? []).reduce(
            (sum: number, step: StepResult<typeof tools>) =>
              sum + (step.toolCalls?.length ?? 0),
            0
          );

          await supabase.from('ai_usage_log').insert({
            organization_id: aiContext.organizationId,
            user_id: user.id,
            model: 'claude-sonnet-4-20250514',
            input_tokens: inputTokens,
            output_tokens: outputTokens,
            estimated_cost_usd: estimatedCost,
            tool_calls_count: toolCallsCount,
            duration_ms: durationMs,
          });

          // ── Audit log entry (GAP-25) ────────────────────────
          await supabase.from('audit_log').insert({
            organization_id: aiContext.organizationId,
            user_id: user.id,
            action: 'ai_chat_message',
            entity_type: 'ai_conversation',
            metadata: {
              input_tokens: inputTokens,
              output_tokens: outputTokens,
              tool_calls: toolCallsCount,
              duration_ms: durationMs,
            },
          });
        } catch (trackingError) {
          // Non-blocking: don't fail the response if tracking fails
          log.error('AI usage tracking error', {}, trackingError);
        }
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
