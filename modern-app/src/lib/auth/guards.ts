// src/lib/auth/guards.ts
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/require-session";
import { userService } from "@/lib/services/user-service";
import type { Session } from "next-auth";
import type { UserRole } from "@/lib/auth/roles";

export type Role = Exclude<UserRole, "user">;
export type Tier = "basic" | "pro" | "business";

// ---- Tier helpers -----------------------------------------------------------

export const tierOrder: Record<Tier, number> = { basic: 0, pro: 1, business: 2 };

export function hasTierOrHigher(userTier: Tier | undefined, min: Tier) {
  const t = normalizeTier(userTier);
  return tierOrder[t] >= tierOrder[min];
}

function normalizeTier(t?: string): Tier {
  if (t === "pro" || t === "business") return t;
  return "basic";
}

// ---- Role guards (server-authoritative; use in routes/server components) ----

export async function requireRole(role: Role) {
  const session = await requireSession();
  if (session.user.role !== role) redirect("/dashboard");
  return session;
}

export async function requireAnyRole(roles: Role[]) {
  const session = await requireSession();
  if (!roles.includes(session.user.role as Role)) redirect("/dashboard");
  return session;
}

// ---- Email verification guard (optional but recommended) --------------------
// Blocks access to pages/APIs that require a verified email. This is a
// defense-in-depth measure in addition to blocking unverified logins.
export async function requireVerifiedEmail() {
  const session = await requireSession();
  if (!session.user.emailVerified) {
    redirect("/login?message=verify-required");
  }
  return session;
}

// ---- Subscription / Tier guard (fresh Firestore read) -----------------------
// Reflects Stripe webhook updates by preferring a *fresh* read for tier/status.
// If subscriptionStatus is not "active", we treat the user effectively as "basic".
type UserDoc = {
  role?: Role;
  subscriptionTier?: Tier;
  subscriptionStatus?: string;
  tier?: Tier; // fallback field name
  email?: string;
};

export async function requireSubscription(
  min: Tier,
  opts: { allowAdminBypass?: boolean } = { allowAdminBypass: true }
): Promise<{ session: Session; tier: Tier; subscriptionStatus: string }> {
  const session = await requireSession();

  // Optional admin bypass for paid features
  if (opts.allowAdminBypass && session.user.role === "admin") {
    return { session, tier: "business" as Tier, subscriptionStatus: "active" as const };
  }

  // Prefer fresh Firestore read to reflect latest Stripe/webhook changes
  const email = session.user.email as string | undefined;
  let fresh: UserDoc | null = null;
  if (email) {
    try {
      fresh = (await userService.getUserByEmail(email)) as unknown as UserDoc;
    } catch {
      // fall through to session values if Firestore read fails
      fresh = null;
    }
  }

  const subscriptionStatus = fresh?.subscriptionStatus ?? session.user.subscriptionStatus;

  const rawTier =
    fresh?.subscriptionTier ?? fresh?.tier ?? session.user.subscriptionTier ?? (session.user as { tier?: Tier }).tier;

  // If not actively subscribed, access falls back to "basic"
  const effectiveTier: Tier = subscriptionStatus === "active" ? normalizeTier(rawTier) : "basic";

  if (!hasTierOrHigher(effectiveTier, min)) {
    // Friendly redirect; the POST/API should still enforce and return 403.
    redirect("/dashboard");
  }

  return { session, tier: effectiveTier, subscriptionStatus: subscriptionStatus ?? "unknown" };
}
