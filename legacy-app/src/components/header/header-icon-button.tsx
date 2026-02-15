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
          // shape + layout
          "h-10 w-10 rounded-full flex items-center justify-center",

          // ✅ token-based “chip” surface
          // light: subtle gray-blue chip
          // dark: navy chip
          "bg-secondary text-foreground border border-border/60 shadow-sm",

          // interactions
          "transition-colors duration-200",
          "hover:bg-muted hover:border-border",
          "active:scale-[0.98]",

          // focus
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",

          // active state (current page / open state)
          active && "bg-primary/12 text-primary border-primary/30",

          className
        )}
        {...props}>
        {children}
      </button>
    );
  }
);

HeaderIconButton.displayName = "HeaderIconButton";
