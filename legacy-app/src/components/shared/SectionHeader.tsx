"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  description?: string;
  viewAllUrl?: string;
  viewAllText?: string;
  centered?: boolean;
  className?: string;
}

export function SectionHeader({
  title,
  description,
  viewAllUrl,
  viewAllText = "View All",
  centered = false,
  className
}: SectionHeaderProps) {
  if (centered) {
    return (
      <div className={cn("flex flex-col items-center mb-12", className)}>
        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">{title}</h2>
        <div className="w-12 h-0.5 bg-primary mb-6"></div>
        {description && <p className="text-muted-foreground text-center max-w-2xl leading-relaxed">{description}</p>}
        {viewAllUrl && (
          <div className="mt-6">
            <Button asChild variant="outline">
              <Link href={viewAllUrl}>
                {viewAllText} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("mb-8", className)}>
      {/* Mobile: Stacked layout */}
      <div className="block md:hidden">
        <h2 className="text-2xl md:text-3xl font-bold mb-2">{title}</h2>
        {description && <p className="text-muted-foreground leading-relaxed mb-4">{description}</p>}
        {viewAllUrl && (
          <Button asChild variant="outline" size="sm">
            <Link href={viewAllUrl}>
              {viewAllText} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>

      {/* Desktop: Horizontal layout */}
      <div className="hidden md:flex justify-between items-start">
        <div className="flex-1 mr-6">
          <h2 className="text-3xl font-bold mb-2">{title}</h2>
          {description && <p className="text-muted-foreground max-w-2xl leading-relaxed">{description}</p>}
        </div>
        {viewAllUrl && (
          <Button asChild variant="outline" className="flex-shrink-0">
            <Link href={viewAllUrl}>
              {viewAllText} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
