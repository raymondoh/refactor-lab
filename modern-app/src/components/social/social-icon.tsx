"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface SocialIconProps {
  href: string;
  label: string;
  icon: React.ReactNode;
  variant?: "primary" | "outline"; // You can extend this later (e.g. ghost, subtle).
}

export function SocialIcon({ href, label, icon, variant = "primary" }: SocialIconProps) {
  return (
    <Link
      href={href}
      aria-label={label}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 shadow-sm",
        "focus-visible:ring-2 focus-visible:ring-primary/40",
        variant === "primary" &&
          "bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground hover:shadow-md",
        variant === "outline" &&
          "border border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}>
      {icon}
    </Link>
  );
}
