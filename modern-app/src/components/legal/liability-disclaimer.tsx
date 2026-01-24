"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface LiabilityDisclaimerProps {
  /** "customer" (default), "tradesperson", or "generic" */
  context?: "customer" | "tradesperson" | "generic";
  variant?: "default" | "subtle";
  className?: string;
}

/**
 * Displays a legal disclaimer clarifying Plumbers Portal’s marketplace role.
 * A11y:
 * - role="alert" + aria-live="polite" so screen readers announce it
 * - kept variants so you can use subtle in tight layouts (dialogs, cards)
 */
export function LiabilityDisclaimer({
  context = "customer",
  variant = "default",
  className
}: LiabilityDisclaimerProps) {
  let message: string;

  switch (context) {
    case "tradesperson":
      message =
        "Plumbers Portal connects customers with independent tradespeople. We are not a party to any work contract. All agreements, pricing, and services are made directly between the customer and the tradesperson.";
      break;
    case "customer":
      message =
        "By accepting a quote or making payment, you acknowledge that the contract for work is between you and the independent tradesperson. Plumbers Portal does not perform plumbing services and is not a party to your contract.";
      break;
    default:
      message =
        "Plumbers Portal is an online marketplace connecting customers and tradespeople. We are not a party to any contracts formed between users.";
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "text-xs leading-relaxed rounded-md border p-3",
        variant === "subtle"
          ? "bg-muted/40 border-muted-foreground/10 text-muted-foreground"
          : "bg-muted border-border text-muted-foreground",
        className
      )}>
      <strong className="text-foreground">Note:</strong> {message}
    </div>
  );
}
