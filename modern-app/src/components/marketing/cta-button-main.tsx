// src/components/marketing/cta-button-main.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import type { VariantProps } from "class-variance-authority";

import { trackEvent as track } from "@/lib/analytics/track";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

type ButtonVariant = VariantProps<typeof buttonVariants>["variant"];
type ButtonSize = VariantProps<typeof buttonVariants>["size"];

export type CtaButtonProps = {
  href: string;
  label: string;
  page: string;
  eventName: "landing_click_primary_cta" | "landing_click_secondary_cta";
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  icon?: React.ReactNode;
};

export function CtaButton({
  href,
  label,
  page,
  eventName,
  variant = "primary",
  size = "lg",
  className,
  icon
}: CtaButtonProps) {
  const handleClick = React.useCallback(() => {
    track(eventName, { page, href, label });
  }, [eventName, href, label, page]);

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={cn(
        buttonVariants({ variant, size }),
        "font-semibold shadow-sm inline-flex items-center justify-center gap-2",
        className
      )}>
      {icon}
      <span>{label}</span>
    </Link>
  );
}

export { CtaButton as CtaButtonMain };
