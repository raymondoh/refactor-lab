// src/components/subscriptions/subscription-badge.tsx
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Tier = "basic" | "pro" | "business";

interface SubscriptionBadgeProps extends Omit<ButtonProps, "variant" | "children"> {
  tier?: Tier | null; // allow undefined/null and default internally
}

export default function SubscriptionBadge({ tier, className, ...props }: SubscriptionBadgeProps) {
  const t: Tier = tier ?? "basic";

  const variant: ButtonProps["variant"] = t === "business" ? "primary" : t === "pro" ? "secondary" : "subtle";

  const overrideClass = t === "basic" ? "bg-accent" : "";

  const label = t.charAt(0).toUpperCase() + t.slice(1); // Basic / Pro / Business

  return (
    <Button variant={variant} className={cn("text-sm font-medium", overrideClass, className)} {...props}>
      {label}
    </Button>
  );
}
