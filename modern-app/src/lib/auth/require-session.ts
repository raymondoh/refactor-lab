// src/lib/auth/require-session.ts
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import { userService } from "@/lib/services/user-service";
//import type { UserRole } from "@/lib/auth/roles";
// Assuming User type is imported from your types file
import type { User } from "@/lib/types/user";
// Assuming SubscriptionTier and SubscriptionStatus are imported or defined
//import type { SubscriptionTier, SubscriptionStatus } from "@/lib/types/next-auth";
import { logger } from "@/lib/logger";

// --- Define Normalization Functions ---
const ROLE_VALUES = ["admin", "tradesperson", "customer", "user", "business_owner", "manager"] as const;
type RoleUnion = (typeof ROLE_VALUES)[number];
function toRole(r: unknown): RoleUnion {
  return ROLE_VALUES.includes(r as RoleUnion) ? (r as RoleUnion) : "customer";
}

const TIER_VALUES = ["basic", "pro", "business"] as const;
type TierUnion = (typeof TIER_VALUES)[number];
// function toTier(t: unknown): TierUnion {
//   // Map "free", null, undefined, or anything else to "basic"
//   if (t === "pro" || t === "business") {
//     return t;
//   }
//   return "basic";
// }
function toTier(t: unknown): TierUnion {
  return TIER_VALUES.includes(t as TierUnion) ? (t as TierUnion) : "basic";
}

const STATUS_VALUES = [
  "active",
  "canceled",
  "incomplete",
  "incomplete_expired",
  "past_due",
  "trialing",
  "unpaid"
] as const;
type StatusUnion = (typeof STATUS_VALUES)[number];
function toStatus(s: unknown): StatusUnion | null {
  return STATUS_VALUES.includes(s as StatusUnion) ? (s as StatusUnion) : null;
}
// --- End Normalization Functions ---

// Helper function to create the enriched user object
function enrichUser(sessionUser: Session["user"], dbUser: User | null): Session["user"] {
  if (!dbUser) {
    // This case should ideally trigger a sign-out as handled in requireSession/getOptionalFreshSession
    return sessionUser;
  }
  // Merge DB data onto the session data, prioritizing DB data for critical fields
  return {
    ...sessionUser, // Keep original session fields like id, emailVerified from token initially
    role: toRole(dbUser.role),
    subscriptionTier: toTier(dbUser.subscriptionTier),
    subscriptionStatus: toStatus(dbUser.subscriptionStatus),
    name: dbUser.name ?? sessionUser.name ?? null,
    businessName: dbUser.businessName ?? sessionUser.businessName ?? null,
    image: dbUser.profilePicture ?? sessionUser.image ?? null, // Prefer profilePicture if available
    onboardingComplete: dbUser.onboardingComplete ?? false,
    // Ensure emailVerified from DB (which might be Date | null) aligns with session expectation (Date | null)
    // The session callback already handles converting the token's Date|null value.
    // No explicit conversion needed here if types match. If session expects boolean, convert dbUser.emailVerified.
    emailVerified: dbUser.emailVerified instanceof Date ? dbUser.emailVerified : sessionUser.emailVerified
  };
}

/**
 * Fetches the NextAuth session and ENRICHES it with fresh data from Firestore.
 * Redirects to /login if unauthenticated.
 * Forces sign-out if user exists in session but not DB.
 */
export async function requireSession(): Promise<Session> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const dbUser = await userService.getUserById(session.user.id);

  if (!dbUser) {
    // If user exists in session but not DB (e.g., deleted), sign them out.
    logger.info(`[requireSession] User ${session.user.id} found in session but not in DB. Forcing sign out.`);
    redirect("/api/auth/signout"); // Force sign out
  }

  // Enrich the session object by creating a new user object
  const enrichedUser = enrichUser(session.user, dbUser);
  logger.info("[requireSession] Enriched session user data:", enrichedUser);

  // Return a new session object with the enriched user data
  return {
    ...session,
    user: enrichedUser
  };
}

/**
 * Same as above, but returns null if not logged in or if DB user doesn't exist (no redirect).
 */
export async function getOptionalFreshSession(): Promise<Session | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const dbUser = await userService.getUserById(session.user.id);

  if (!dbUser) {
    // If user doesn't exist in DB, treat session as invalid/stale.
    logger.info(
      `[getOptionalFreshSession] User ${session.user.id} found in session but not in DB. Returning null session.`
    );
    return null;
  }

  // Enrich the session object
  const enrichedUser = enrichUser(session.user, dbUser);
  logger.info("[getOptionalFreshSession] Enriched session user data:", enrichedUser);

  // Return a new session object with the enriched user data
  return {
    ...session,
    user: enrichedUser
  };
}
