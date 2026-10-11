"use client";

import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pageTokens } from "@/lib/pagination";
import { cn } from "cn";

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  siblingCount = 1,
  label = "Pagination",
  className,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  label?: string;
  className?: string;
}) {
  if (pageSize < 1 || total <= pageSize) return null;

  const totalPages = Math.ceil(total / pageSize);
  const current = Math.min(Math.max(page, 1), totalPages);
  const tokens = pageTokens(current, totalPages, siblingCount);
  const from = (current - 1) * pageSize + 1;
  const to = Math.min(current * pageSize, total);

  return (
    <nav
      aria-label={label}
      data-slot="pagination"
      className={cn(
        "flex flex-wrap items-center justify-between gap-3",
        className,
      )}
    >
      <p className="text-xs text-muted-foreground">
        {from}–{to} of {total}
      </p>
      <ul className="flex flex-wrap items-center gap-1">
        <li>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Previous page"
            disabled={current <= 1}
            onClick={() => onPageChange(current - 1)}
            className="cursor-pointer"
          >
            <ChevronLeft />
          </Button>
        </li>
        {tokens.map((token, index) =>
          token === "ellipsis" ? (
            <li key={`ellipsis-${index}`}>
              <span className="flex size-7 items-center justify-center text-muted-foreground">
                <MoreHorizontal className="size-4" aria-hidden="true" />
                <span className="sr-only">More pages</span>
              </span>
            </li>
          ) : (
            <li key={token}>
              <Button
                type="button"
                variant={token === current ? "default" : "ghost"}
                size="sm"
                aria-label={`Page ${token}`}
                aria-current={token === current ? "page" : undefined}
                onClick={() => {
                  if (token !== current) onPageChange(token);
                }}
                className="min-w-7 cursor-pointer px-0"
              >
                {token}
              </Button>
            </li>
          ),
        )}
        <li>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Next page"
            disabled={current >= totalPages}
            onClick={() => onPageChange(current + 1)}
            className="cursor-pointer"
          >
            <ChevronRight />
          </Button>
        </li>
      </ul>
    </nav>
  );
}
