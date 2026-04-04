/**
 * Centralized API error handler and response envelope.
 *
 * Provides a universal response format and maps AppError subclasses
 * to appropriate HTTP responses. Internal error details are never
 * leaked to the client.
 *
 * @module lib/api/response
 */

import { NextResponse } from 'next/server';
import { AppError, isAppError, RateLimitError } from '@/lib/errors';
import { createLogger } from '@/lib/logger';

const log = createLogger('api');

// ─── Universal Response Envelope ───────────────────────────────────────────

interface SuccessResponse<T> {
  data: T;
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
    timestamp: string;
  };
}

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/** Wrap a successful result in the standard envelope. */
export function apiSuccess<T>(
  data: T,
  status = 200,
  meta?: SuccessResponse<T>['meta'],
): NextResponse<SuccessResponse<T>> {
  return NextResponse.json(
    {
      data,
      meta: meta ?? { timestamp: new Date().toISOString() },
    },
    { status },
  );
}

/** Wrap a paginated result in the standard envelope. */
export function apiPaginated<T>(
  data: T[],
  page: number,
  pageSize: number,
  total: number,
): NextResponse<SuccessResponse<T[]>> {
  return NextResponse.json(
    {
      data,
      meta: {
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
        timestamp: new Date().toISOString(),
      },
    },
    { status: 200 },
  );
}

/**
 * Map any error to a sanitized HTTP response.
 *
 * - AppError subclasses map to their statusCode with code + message.
 * - Unknown errors map to 500 with a generic message.
 * - Internal details (stack traces, DB errors) are NEVER sent to clients.
 */
export function apiError(
  error: unknown,
  routeContext?: string,
): NextResponse<ErrorResponse> {
  if (isAppError(error)) {
    log.warn(`API error: ${error.code}`, {
      route: routeContext,
      statusCode: error.statusCode,
      ...error.context,
    });

    const headers: HeadersInit = {};
    if (error instanceof RateLimitError) {
      headers['Retry-After'] = String(error.retryAfterSeconds);
    }

    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
        },
      },
      { status: error.statusCode, headers },
    );
  }

  // Unknown / unexpected error — log full details server-side, return generic message
  log.error(
    'Unhandled API error',
    { route: routeContext },
    error,
  );

  return NextResponse.json(
    {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred. Please try again later.',
      },
    },
    { status: 500 },
  );
}
