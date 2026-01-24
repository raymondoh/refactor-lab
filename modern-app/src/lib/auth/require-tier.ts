// src/lib/auth/require-tier.ts
import { requireSession } from "@/lib/auth/require-session";
import { asTier, meets, type Tier } from "@/lib/subscription/tier";

/**
 * Server-side guard that returns the effective tier (DB-enriched session) or throws if insufficient.
 * NOTE: requireSession() already refreshes user data from Firestore (DB > token),
 * so we should NOT re-fetch here.
 */
export async function requireTier(required: Tier | Tier[]) {
  const session = await requireSession();

  // Effective tier comes from the enriched session (DB > token)
  const effective = asTier(session.user.subscriptionTier);

  // meets() expects (required, actual)
  const ok = Array.isArray(required) ? required.some(r => meets(r, effective)) : meets(required, effective);

  if (!ok) {
    throw new Error("FORBIDDEN_TIER");
  }

  return effective;
}

// Re-export for any existing imports (e.g. SaveJobButton)
export { asTier, meets };
export type { Tier };
