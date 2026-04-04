/**
 * Canonical error hierarchy for FlyteDeck.
 *
 * All service-layer errors extend AppError. API route handlers catch these
 * and map them to HTTP responses via the centralized error handler.
 *
 * @module lib/errors
 */

/** Base application error with machine-readable code and HTTP status mapping. */
export class AppError extends Error {
  readonly code: string;
  readonly statusCode: number;
  readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    statusCode: number,
    context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.context = context;
  }
}

/** 400 — Input failed validation. */
export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, context);
    this.name = 'ValidationError';
  }
}

/** 401 — No valid authentication credentials. */
export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

/** 403 — Authenticated but insufficient permissions. */
export class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions', context?: Record<string, unknown>) {
    super(message, 'AUTHORIZATION_ERROR', 403, context);
    this.name = 'AuthorizationError';
  }
}

/** 404 — Requested resource does not exist or is not accessible. */
export class NotFoundError extends AppError {
  constructor(entity: string, id?: string) {
    const message = id ? `${entity} not found: ${id}` : `${entity} not found`;
    super(message, 'NOT_FOUND', 404, { entity, id });
    this.name = 'NotFoundError';
  }
}

/** 409 — Operation conflicts with current resource state. */
export class ConflictError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'CONFLICT', 409, context);
    this.name = 'ConflictError';
  }
}

/** 422 — Request is well-formed but semantically invalid. */
export class UnprocessableError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'UNPROCESSABLE_ENTITY', 422, context);
    this.name = 'UnprocessableError';
  }
}

/** 429 — Rate limit exceeded. */
export class RateLimitError extends AppError {
  readonly retryAfterSeconds: number;

  constructor(retryAfterSeconds = 60) {
    super('Rate limit exceeded', 'RATE_LIMITED', 429, { retryAfterSeconds });
    this.name = 'RateLimitError';
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

/** 502 — An external service call failed. */
export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, context?: Record<string, unknown>) {
    super(`External service error (${service}): ${message}`, 'EXTERNAL_SERVICE_ERROR', 502, {
      service,
      ...context,
    });
    this.name = 'ExternalServiceError';
  }
}

/**
 * Type guard: check if an unknown value is an AppError.
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
