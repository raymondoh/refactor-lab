import React from "react";
import { ChevronRight } from "lucide-react";

interface DashboardHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: Array<{
    label: string;
    href?: string;
  }>;
  children?: React.ReactNode;
}

export function DashboardHeader({ title, description, breadcrumbs = [], children }: DashboardHeaderProps) {
  return (
    <div className="mb-8">
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <nav className="flex items-center text-sm text-muted-foreground mb-2">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {index > 0 && <ChevronRight className="h-4 w-4 mx-1" />}
              {crumb.href ? (
                <a href={crumb.href} className="hover:text-foreground transition-colors">
                  {crumb.label}
                </a>
              ) : (
                <span>{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      <div className="flex items-center justify-between">
        <div className="space-y-1">
          {/* Title with decorative line */}
          <div className="relative">
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            {/* <div className="absolute -bottom-3 left-0 h-1 w-20 bg-primary rounded-full"></div> */}
          </div>

          {/* Description */}
          {description && <p className="mt-6 text-muted-foreground max-w-3xl">{description}</p>}
        </div>

        {children && <div className="flex items-center gap-2">{children}</div>}
      </div>
    </div>
  );
}
