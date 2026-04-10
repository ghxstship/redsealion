/**
 * Server-side pagination helper.
 * Extracts `page` and `limit` from searchParams, applies to Supabase query.
 *
 * @module lib/pagination
 */

export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 200;

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginatedResult<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

/**
 * Parse page/limit from searchParams.
 */
export function parsePagination(searchParams: URLSearchParams | Record<string, string | undefined>): PaginationParams {
  let page: number;
  let limit: number;

  if (searchParams instanceof URLSearchParams) {
    page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
    limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(searchParams.get('limit') ?? String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE));
  } else {
    page = Math.max(1, parseInt(searchParams.page ?? '1', 10) || 1);
    limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(searchParams.limit ?? String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE));
  }

  return { page, limit, offset: (page - 1) * limit };
}

/**
 * Wrap data array with pagination metadata.
 */
export function paginatedResponse<T>(data: T[], total: number, params: PaginationParams): PaginatedResult<T> {
  const totalPages = Math.ceil(total / params.limit);
  return {
    data,
    page: params.page,
    limit: params.limit,
    total,
    totalPages,
    hasMore: params.page < totalPages,
  };
}
