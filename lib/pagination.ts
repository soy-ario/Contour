import { z } from "zod";

const paginationSchema = z.object({
  cursor: z.string().optional().nullable(),
  take: z.preprocess(
    (val) => (val ? parseInt(val as string, 10) : undefined),
    z.number().int().min(1).max(100).default(20)
  ),
  direction: z.enum(["forward", "backward"]).default("forward"),
});

export type PaginationParams = z.infer<typeof paginationSchema>;

export function parsePaginationParams(searchParams: URLSearchParams): PaginationParams {
  const params = {
    cursor: searchParams.get("cursor"),
    take: searchParams.get("take"),
    direction: searchParams.get("direction"),
  };
  return paginationSchema.parse(params);
}

export function buildPaginatedResult<T extends { id: string }>(
  items: T[],
  take: number,
  cursor?: string | null,
  totalCount = 0
) {
  const hasMore = items.length > take;
  const data = hasMore ? items.slice(0, take) : items;
  
  const nextCursor = hasMore && data.length > 0 ? data[data.length - 1].id : null;
  const prevCursor = cursor || null;

  return {
    data,
    pagination: {
      hasNextPage: hasMore,
      hasPrevPage: !!cursor,
      nextCursor,
      prevCursor,
      total: totalCount,
      take,
    },
  };
}
