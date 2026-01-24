import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const textButtonVariants = cva(
  "inline-flex items-center gap-2 text-sm font-medium text-primary underline-offset-4 transition-colors hover:text-primary/90 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      size: {
        default: "",
        sm: "text-xs",
        lg: "text-base"
      }
    },
    defaultVariants: {
      size: "default"
    }
  }
);

type TextButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof textButtonVariants> & {
    asChild?: boolean;
  };

function TextButton({ className, asChild = false, size, ...props }: TextButtonProps) {
  const Comp = asChild ? Slot : "button";

  return <Comp className={cn(textButtonVariants({ size, className }))} {...props} />;
}

export { TextButton, textButtonVariants };
