// src/lib/subscription/tier.ts
import type { UserRole } from "@/lib/auth/roles";

export type Tier = "basic" | "pro" | "business";

export const TIER_ORDER: Tier[] = ["basic", "pro", "business"];

/**
 * Returns true if `actual` meets or exceeds `required`.
 * Defaults `actual` to "basic" if missing.
 */
export function meets(required: Tier, actual?: Tier) {
  const a = TIER_ORDER.indexOf(actual ?? "basic");
  const r = TIER_ORDER.indexOf(required);
  return a >= r;
}

export function asTier(x: unknown): Tier {
  return x === "pro" || x === "business" ? x : "basic";
}

/**
 * Used by Stripe success/webhook flows to set a sensible role
 * when tier changes (admin stays admin).
 */
export function deriveRoleFromTier(tier: Tier, currentRole?: UserRole | null): UserRole {
  if (currentRole === "admin") return "admin";
  return tier === "business" ? "business_owner" : "tradesperson";
}
