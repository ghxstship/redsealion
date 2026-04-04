/**
 * Environment variable validation — SSOT.
 *
 * Call `validateEnv()` at startup (e.g., in instrumentation or layout).
 * Throws immediately if required variables are missing, preventing
 * silent runtime failures.
 *
 * @module lib/env
 */

import { z } from 'zod';

// ─── Server-side env (never exposed to client) ─────────────────────────────

const serverSchema = z.object({
  // Supabase
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),

  // Stripe (optional — degrades gracefully if not configured)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_STARTER: z.string().optional(),
  STRIPE_PRICE_PROFESSIONAL: z.string().optional(),
  STRIPE_PRICE_ENTERPRISE: z.string().optional(),

  // Email (optional — falls back to console provider)
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_ADDRESS: z.string().email().optional(),
  EMAIL_PROVIDER: z.enum(['console', 'resend', 'smtp']).default('console'),

  // SMS (optional)
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_FROM_NUMBER: z.string().optional(),

  // Integrations (optional)
  INTEGRATION_ENCRYPTION_KEY: z
    .string()
    .length(64, 'INTEGRATION_ENCRYPTION_KEY must be 64 hex characters (32 bytes)')
    .optional(),
  ZAPIER_WEBHOOK_SECRET: z.string().optional(),

  // Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error', 'fatal']).default('info'),

  // Node
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

// ─── Public env (exposed to client via NEXT_PUBLIC_ prefix) ─────────────────

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});

// ─── Combined ───────────────────────────────────────────────────────────────

export type ServerEnv = z.infer<typeof serverSchema>;
export type PublicEnv = z.infer<typeof publicSchema>;

let _serverEnv: ServerEnv | null = null;
let _publicEnv: PublicEnv | null = null;

/**
 * Validate and return all server-side environment variables.
 * Cached after first call.
 */
export function getServerEnv(): ServerEnv {
  if (_serverEnv) return _serverEnv;

  const result = serverSchema.safeParse(process.env);
  if (!result.success) {
    const formatted = result.error.issues
      .map((i) => `  • ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`❌ Server environment validation failed:\n${formatted}`);
  }

  _serverEnv = result.data;
  return _serverEnv;
}

/**
 * Validate and return all public (NEXT_PUBLIC_) environment variables.
 * Cached after first call.
 */
export function getPublicEnv(): PublicEnv {
  if (_publicEnv) return _publicEnv;

  const result = publicSchema.safeParse(process.env);
  if (!result.success) {
    const formatted = result.error.issues
      .map((i) => `  • ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`❌ Public environment validation failed:\n${formatted}`);
  }

  _publicEnv = result.data;
  return _publicEnv;
}

/**
 * Validate all environment variables at startup.
 * Intended to be called once in app bootstrap.
 */
export function validateEnv(): void {
  getServerEnv();
  getPublicEnv();
}
