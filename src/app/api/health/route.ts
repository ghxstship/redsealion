/**
 * Health check endpoint.
 *
 * Checks: application process, database connectivity.
 * Returns 200 if all checks pass, 503 if any fail.
 */

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

interface HealthCheck {
  service: string;
  status: 'ok' | 'error';
  latencyMs?: number;
  error?: string;
}

export async function GET() {
  const checks: HealthCheck[] = [];
  let allHealthy = true;

  // 1. Application process — always ok if this handler executes
  checks.push({ service: 'app', status: 'ok' });

  // 2. Database connectivity
  const dbStart = Date.now();
  try {
    const supabase = await createServiceClient();
    const { error } = await supabase.from('organizations').select('id').limit(1);
    const latencyMs = Date.now() - dbStart;

    if (error) {
      checks.push({ service: 'database', status: 'error', latencyMs, error: 'Database connection unavailable' });
      allHealthy = false;
    } else {
      checks.push({ service: 'database', status: 'ok', latencyMs });
    }
  } catch (err) {
    const latencyMs = Date.now() - dbStart;
    checks.push({
      service: 'database',
      status: 'error',
      latencyMs,
      error: 'Database connection unavailable',
    });
    allHealthy = false;
  }

  return NextResponse.json(
    {
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: allHealthy ? 200 : 503 },
  );
}
