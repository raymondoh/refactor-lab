// src/components/modals/brand-modal.tsx
"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type BrandModalSize = "sm" | "md" | "lg";

export interface BrandModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: BrandModalSize;
  className?: string; // extra classes on DialogContent
}

/**
 * BrandModal
 *
 * A brand-styled wrapper around Shadcn's Dialog.
 * Use this for all informational / success / generic modals.
 */
export function BrandModal({
  open,
  onOpenChange,
  title,
  description,
  icon,
  children,
  footer,
  size = "md",
  className
}: BrandModalProps) {
  const maxWidth = size === "sm" ? "sm:max-w-md" : size === "lg" ? "sm:max-w-2xl" : "sm:max-w-xl";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "bg-card text-card-foreground border border-border",
          "rounded-xl shadow-xl px-6 py-6 sm:px-8 sm:py-8",
          "max-w-[95vw] w-full",
          maxWidth,
          className
        )}>
        <DialogHeader className="items-center text-center space-y-3">
          {icon && (
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">{icon}</div>
          )}
          {title && <DialogTitle className="text-xl font-semibold tracking-tight">{title}</DialogTitle>}
          {description && (
            <DialogDescription className="text-sm text-muted-foreground">{description}</DialogDescription>
          )}
        </DialogHeader>

        {children && <div className="mt-4 space-y-4 text-sm text-muted-foreground text-left">{children}</div>}

        {footer && (
          <DialogFooter className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">{footer}</DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
