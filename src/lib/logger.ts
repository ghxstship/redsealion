/**
 * Structured JSON logger for FlyteDeck.
 *
 * All log output is JSON-formatted with canonical fields:
 * timestamp, level, service, message, context.
 *
 * Replaces all console.log/console.error usage in production code.
 *
 * @module lib/logger
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
  context?: Record<string, unknown>;
  trace_id?: string;
  user_id?: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

const CURRENT_LEVEL: LogLevel =
  (process.env.LOG_LEVEL as LogLevel | undefined) ??
  (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

/** Scrub sensitive fields from context before logging. */
function scrubSensitive(context: Record<string, unknown>): Record<string, unknown> {
  const REDACTED = '[REDACTED]';
  const sensitiveKeys = new Set([
    'password', 'token', 'secret', 'api_key', 'apiKey',
    'access_token', 'refresh_token', 'authorization',
    'credit_card', 'ssn', 'session_cookie',
    'access_token_encrypted', 'refresh_token_encrypted',
  ]);

  const scrubbed: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(context)) {
    if (sensitiveKeys.has(key.toLowerCase())) {
      scrubbed[key] = REDACTED;
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      scrubbed[key] = scrubSensitive(value as Record<string, unknown>);
    } else {
      scrubbed[key] = value;
    }
  }
  return scrubbed;
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[CURRENT_LEVEL];
}

function emit(entry: LogEntry): void {
  const output = JSON.stringify(entry);
  if (entry.level === 'error' || entry.level === 'fatal') {
    console.error(output);
  } else if (entry.level === 'warn') {
    console.warn(output);
  } else {
    console.log(output);
  }
}

/** Create a logger instance scoped to a service/module. */
export function createLogger(service: string) {
  function log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: unknown,
  ): void {
    if (!shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service,
      message,
      ...(context && { context: scrubSensitive(context) }),
    };

    if (error instanceof Error) {
      entry.error = {
        name: error.name,
        message: error.message,
        ...(process.env.NODE_ENV !== 'production' && { stack: error.stack }),
      };
    }

    emit(entry);
  }

  return {
    debug: (message: string, context?: Record<string, unknown>) =>
      log('debug', message, context),
    info: (message: string, context?: Record<string, unknown>) =>
      log('info', message, context),
    warn: (message: string, context?: Record<string, unknown>, error?: unknown) =>
      log('warn', message, context, error),
    error: (message: string, context?: Record<string, unknown>, error?: unknown) =>
      log('error', message, context, error),
    fatal: (message: string, context?: Record<string, unknown>, error?: unknown) =>
      log('fatal', message, context, error),
  };
}

/** Singleton logger for general application use. */
const logger = createLogger('flytedeck');
