import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DashboardCardProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  footer?: ReactNode;
  className?: string;
  children: ReactNode;
  isLoading?: boolean;
}

export function DashboardCard({
  title,
  description,
  icon,
  footer,
  className,
  children,
  isLoading = false
}: DashboardCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden",
        isLoading && "animate-pulse",
        className
      )}>
      {/* Card header */}
      {(title || description || icon) && (
        <div className="flex flex-col space-y-1.5 p-6 pb-4">
          {/* Title row with optional icon */}
          <div className="flex items-center gap-3">
            {icon && <div className="flex-shrink-0 text-primary">{icon}</div>}
            {title && <h3 className="font-semibold text-lg leading-none tracking-tight">{title}</h3>}
          </div>

          {/* Description */}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      )}

      {/* Card content */}
      <div className={cn("p-6 pt-0", !title && !description && !icon && "pt-6")}>{children}</div>

      {/* Optional footer */}
      {footer && <div className="border-t bg-muted/50 px-6 py-4">{footer}</div>}
    </div>
  );
}
