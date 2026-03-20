export const buildPagination = (page = 1, limit = 10) => {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 50);

  return {
    page: safePage,
    limit: safeLimit,
    skip: (safePage - 1) * safeLimit
  };
};

export const createPaginatedResponse = ({ docs, total, page, limit }) => ({
  items: docs,
  pagination: {
    total,
    page,
    limit,
    pages: Math.ceil(total / limit)
  }
});
