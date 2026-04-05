import { NextResponse } from 'next/server';

/**
 * Centralized cron endpoint authentication guard — SSOT.
 *
 * All cron routes MUST call this at the top of their handler.
 * Validates `Authorization: Bearer <CRON_SECRET>` header.
 * Rejects with 401 if CRON_SECRET is not configured or doesn't match.
 *
 * @returns null if authorized, NextResponse(401) if denied
 */
export function requireCronAuth(request: Request): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Invalid or missing cron secret' } },
      { status: 401 },
    );
  }

  return null;
}
