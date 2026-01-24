// HeaderIconButton.displayName = "HeaderIconButton";
import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, forwardRef } from "react";

interface HeaderIconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export const HeaderIconButton = forwardRef<HTMLButtonElement, HeaderIconButtonProps>(
  ({ className, children, active = false, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "h-10 w-10 rounded-full", // Keep this rounded
          "flex items-center justify-center",
          "bg-background text-foreground",
          "transition-colors duration-200",
          "hover:bg-muted/50",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          active && "bg-primary/10 text-primary",
          className
        )}
        {...props}>
        {children}
      </button>
    );
  }
);

HeaderIconButton.displayName = "HeaderIconButton";
