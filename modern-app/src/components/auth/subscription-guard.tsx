// src/components/auth/subscription-guard.tsx
"use client";

import { ReactNode } from "react";
import { useSession } from "next-auth/react";
import { asTier, meets, type Tier } from "@/lib/subscription/tier";

interface SubscriptionGuardProps {
  allowedTiers: Tier[];
  children: ReactNode;
  fallback?: ReactNode;
  tierOverride?: Tier;
}

export default function SubscriptionGuard({
  allowedTiers,
  children,
  fallback = null,
  tierOverride
}: SubscriptionGuardProps) {
  const { data: session, status } = useSession();

  if (!tierOverride && status === "loading") return null;

  const tier: Tier = asTier(tierOverride ?? session?.user?.subscriptionTier);

  // Your meets signature is meets(required, actual)
  const isAllowed = allowedTiers.some(required => meets(required, tier));

  return isAllowed ? <>{children}</> : <>{fallback}</>;
}
