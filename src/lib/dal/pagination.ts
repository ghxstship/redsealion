/**
 * Pagination utilities for API routes.
 *
 * Provides type-safe pagination parameter parsing and
 * standardized response envelope formatting.
 *
 * @module lib/dal/pagination
 */

import { z } from 'zod';

// ─── Schemas ────────────────────────────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(25),
  sort_by: z.string().optional(),
  sort_dir: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationParams = z.infer<typeof paginationSchema>;

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Parse pagination parameters from a URL search params object.
 * Returns validated defaults if params are missing or invalid.
 */
export function parsePagination(searchParams: URLSearchParams): PaginationParams {
  return paginationSchema.parse({
    page: searchParams.get('page') ?? undefined,
    page_size: searchParams.get('page_size') ?? searchParams.get('pageSize') ?? undefined,
    sort_by: searchParams.get('sort_by') ?? searchParams.get('sortBy') ?? undefined,
    sort_dir: searchParams.get('sort_dir') ?? searchParams.get('sortDir') ?? undefined,
  });
}

/**
 * Calculate Supabase range parameters from page-based pagination.
 */
export function toSupabaseRange(params: PaginationParams): { from: number; to: number } {
  const from = (params.page - 1) * params.page_size;
  const to = from + params.page_size - 1;
  return { from, to };
}

/**
 * Build a standardized pagination meta object for API responses.
 */
export function paginationMeta(params: PaginationParams, total: number) {
  const totalPages = Math.ceil(total / params.page_size);
  return {
    page: params.page,
    page_size: params.page_size,
    total,
    total_pages: totalPages,
    has_next: params.page < totalPages,
    has_prev: params.page > 1,
  };
}

/**
 * Apply pagination to a Supabase query builder.
 * Returns a chainable query with range and ordering applied.
 */
export function applyPagination<T extends { range: (from: number, to: number) => T; order: (column: string, options?: { ascending?: boolean }) => T }>(
  query: T,
  params: PaginationParams,
  defaultSort = 'created_at'
): T {
  const { from, to } = toSupabaseRange(params);
  const sortCol = params.sort_by || defaultSort;
  return query
    .order(sortCol, { ascending: params.sort_dir === 'asc' })
    .range(from, to);
}
