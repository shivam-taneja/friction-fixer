export const DEFAULT_PAGE_SIZE = 5;
export const MAX_PAGE_SIZE = 50;

export type PageQuery = {
  page: number;
  pageSize: number;
};

export type PageResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type PageToken = number | "ellipsis";

export function parsePageQuery(searchParams: URLSearchParams): PageQuery {
  return {
    page: positiveInt(searchParams.get("page"), 1),
    pageSize: Math.min(
      positiveInt(searchParams.get("pageSize"), DEFAULT_PAGE_SIZE),
      MAX_PAGE_SIZE,
    ),
  };
}

export function paginate<T>(items: T[], query: PageQuery): PageResult<T> {
  const pageSize = Math.min(Math.max(query.pageSize, 1), MAX_PAGE_SIZE);
  const total = items.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
  const page =
    totalPages === 0 ? 1 : Math.min(Math.max(query.page, 1), totalPages);
  const start = (page - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    page,
    pageSize,
    total,
    totalPages,
  };
}

export function pageTokens(
  page: number,
  totalPages: number,
  siblingCount = 1,
): PageToken[] {
  const totalNumbers = siblingCount * 2 + 5;
  if (totalPages <= totalNumbers) {
    return range(1, totalPages);
  }

  const leftSibling = Math.max(page - siblingCount, 1);
  const rightSibling = Math.min(page + siblingCount, totalPages);
  const showLeftEllipsis = leftSibling > 2;
  const showRightEllipsis = rightSibling < totalPages - 1;

  if (!showLeftEllipsis && showRightEllipsis) {
    const leftCount = 3 + siblingCount * 2;
    return [...range(1, leftCount), "ellipsis", totalPages];
  }

  if (showLeftEllipsis && !showRightEllipsis) {
    const rightCount = 3 + siblingCount * 2;
    return [1, "ellipsis", ...range(totalPages - rightCount + 1, totalPages)];
  }

  return [
    1,
    "ellipsis",
    ...range(leftSibling, rightSibling),
    "ellipsis",
    totalPages,
  ];
}

function positiveInt(value: string | null, fallback: number) {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return parsed;
}

function range(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}
