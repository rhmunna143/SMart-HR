export interface PageParams {
  page: number;
  limit: number;
  offset: number;
}

export function parsePage(q: Record<string, unknown>): PageParams {
  const page = Math.max(1, Number(q.page ?? 1) || 1);
  const limit = Math.min(100, Math.max(1, Number(q.limit ?? 20) || 20));
  return { page, limit, offset: (page - 1) * limit };
}

export function pageMeta(total: number, p: PageParams) {
  return {
    page: p.page,
    limit: p.limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / p.limit)),
  };
}
