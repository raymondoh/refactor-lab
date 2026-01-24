// src/components/layout/marketing-header.tsx
"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Container } from "@/components/marketing/container";
import { cn } from "@/lib/utils";

type BreadcrumbSegment = {
  title: string;
  href: string;
};

export interface MarketingHeaderProps {
  /**
   * Optional override for the breadcrumb segments. When omitted the component
   * derives segments from the current pathname.
   */
  segments?: BreadcrumbSegment[];
  /**
   * Optional class names applied to the outer header wrapper.
   */
  className?: string;
  /**
   * Optional class names applied to the inner container wrapper.
   */
  containerClassName?: string;
}

// Helper to format a path segment like "how-it-works" into a title like "How It Works"
function formatSegmentToTitle(segment: string): string {
  if (!segment) return "";
  const title = segment.replace(/-/g, " ");
  // Capitalize the first letter of each word
  return title.replace(/\b\w/g, char => char.toUpperCase());
}

export function MarketingHeader({ segments, className, containerClassName }: MarketingHeaderProps = {}) {
  const pathname = usePathname();

  const derivedSegments = useMemo(() => {
    if (segments && segments.length > 0) {
      return segments;
    }

    // Split the pathname into segments and filter out any empty strings from trailing slashes
    const pathSegments = pathname.split("/").filter(Boolean);

    // Don't render breadcrumbs on the homepage
    if (pathSegments.length === 0) {
      return [];
    }

    // Build the breadcrumb segments array dynamically
    return pathSegments.map((segment, index) => {
      // Reconstruct the href for each part of the path
      const href = "/" + pathSegments.slice(0, index + 1).join("/");
      const title = formatSegmentToTitle(segment);
      return { title, href };
    });
  }, [pathname, segments]);

  if (!derivedSegments.length) {
    return null;
  }

  return (
    <header className={cn("mb-8 py-4", className)}>
      <Container className={containerClassName}>
        <Breadcrumbs segments={derivedSegments} />
      </Container>
    </header>
  );
}
