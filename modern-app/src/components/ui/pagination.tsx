"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  className?: string;
}

export function Pagination({ currentPage, totalPages, className }: PaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  const pageNumbers = [];
  // Show first page, last page, and pages around the current one
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      pageNumbers.push(i);
    }
  }
  
  const renderedPageNumbers = [];
  let lastPage = 0;
  for (const page of pageNumbers) {
    if (lastPage + 1 < page) {
      renderedPageNumbers.push(
        <span key={`ellipsis-${lastPage}`} className="flex items-center justify-center h-9 w-9">
          <MoreHorizontal className="h-4 w-4" />
        </span>
      );
    }
    renderedPageNumbers.push(
      <Button
        key={page}
        asChild
        variant={currentPage === page ? "primary" : "subtle"}
        size="icon"
      >
        <Link href={createPageURL(page)}>{page}</Link>
      </Button>
    );
    lastPage = page;
  }

  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      className={cn("flex items-center justify-center gap-2 mt-8", className)}
      aria-label="Pagination"
    >
      <Button
        asChild
        variant="subtle"
        size="icon"
        disabled={currentPage <= 1}
      >
        <Link href={createPageURL(currentPage - 1)}>
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous</span>
        </Link>
      </Button>

      {renderedPageNumbers}

      <Button
        asChild
        variant="subtle"
        size="icon"
        disabled={currentPage >= totalPages}
      >
        <Link href={createPageURL(currentPage + 1)}>
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next</span>
        </Link>
      </Button>
    </nav>
  );
}
