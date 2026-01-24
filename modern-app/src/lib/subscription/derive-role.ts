// src/lib/subscription/derive-role.ts
import type { UserRole } from "@/lib/auth/roles";
import type { Tier } from "./tier";

export function deriveRoleFromTier(tier: Tier, currentRole?: UserRole | null): UserRole {
  if (currentRole === "admin") return "admin";
  return tier === "business" ? "business_owner" : "tradesperson";
}
