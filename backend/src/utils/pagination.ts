import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationQuery = z.infer<typeof paginationSchema>;

export function skipTake(query: PaginationQuery) {
  const skip = (query.page - 1) * query.limit;
  return { skip, take: query.limit };
}

export function buildMeta(total: number, query: PaginationQuery) {
  return {
    total,
    page: query.page,
    limit: query.limit,
    totalPages: Math.ceil(total / query.limit) || 1,
  };
}
