/**
 * Anthropic Claude client — singleton via Vercel AI SDK.
 *
 * Uses @ai-sdk/anthropic for streaming, tool-use, and provider abstraction.
 * Falls back gracefully when ANTHROPIC_API_KEY is not configured.
 *
 * @module lib/ai/client
 */

import { createAnthropic } from '@ai-sdk/anthropic';

let _client: ReturnType<typeof createAnthropic> | null = null;

/**
 * Returns the singleton Anthropic provider.
 * Throws if ANTHROPIC_API_KEY is not configured.
 */
export function getAnthropicProvider() {
  if (_client) return _client;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY is not configured. AI features are unavailable.'
    );
  }

  _client = createAnthropic({ apiKey });
  return _client;
}

/**
 * Returns the default model for copilot chat.
 * Claude Sonnet 4 — fast, cost-effective, excellent for tool-use.
 */
export function getCopilotModel() {
  const provider = getAnthropicProvider();
  return provider('claude-sonnet-4-20250514');
}

/**
 * Check whether the AI backend is configured and available.
 */
export function isAiConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}
