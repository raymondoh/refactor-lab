// src/auth.ts
import "server-only";

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { getEnv } from "@/lib/env";
import type { Session } from "next-auth";
import { AuthError } from "next-auth";
import { logger } from "@/lib/logger";

import type { SubscriptionTier, SubscriptionStatus } from "@/lib/types/next-auth";
const env = getEnv();
const isDev = process.env.NODE_ENV !== "production";

function normalizeTier(tier: string | null | undefined): SubscriptionTier {
  if (tier === "pro" || tier === "business" || tier === "basic") {
    return tier;
  }
  // Map unknown / null / undefined to "basic"
  return "basic";
}

// Revised normalizeStatus to strictly adhere to the Session['user']['subscriptionStatus'] type
function normalizeStatus(status: string | null | undefined): Session["user"]["subscriptionStatus"] {
  // Explicitly list the allowed string values from the SubscriptionStatus type
  const validStringStatuses: Exclude<SubscriptionStatus, null>[] = [
    "active",
    "canceled",
    "incomplete",
    "incomplete_expired",
    "past_due",
    "trialing",
    "unpaid"
  ];

  // Check if the input status is one of the valid string values
  if (status && validStringStatuses.includes(status as Exclude<SubscriptionStatus, null>)) {
    return status as Exclude<SubscriptionStatus, null>;
  }

  // If the status is explicitly null, or if it's undefined or an invalid string, return null
  // This aligns with the 'null' possibility in the SubscriptionStatus type
  return null;
}
// --- End Normalization Functions ---

// A custom error class for the unverified email case
class UnverifiedEmailError extends AuthError {
  constructor(message?: string) {
    super(message);
    this.type = "CredentialsSignin";
    this.cause = { err: new Error("unverified") };
  }
}

const {
  handlers,
  auth: nextAuthAuth,
  signIn,
  signOut
} = NextAuth({
  pages: { signIn: "/login", error: "/login" },

  callbacks: {
    async signIn({ user, account }) {
      logger.info("\n--- [auth.ts] signIn callback triggered ---");
      logger.info("Provider:", account?.provider);

      if (account?.provider === "google") {
        try {
          const { userService } = await import("@/lib/services/user-service");

          if (!user.email) {
            logger.error("[auth.signIn] Google account missing email, aborting sign-in.");
            return false;
          }

          const displayName = user.name ?? user.email.split("@")[0];

          const dbUser = await userService.findOrCreateUser({
            email: user.email,
            name: displayName,
            businessName: "",
            profilePicture: user.image,
            authProvider: account.provider
          });

          if (!dbUser) {
            logger.info("[auth.signIn] findOrCreateUser returned null. Aborting sign-in.");
            return false;
          }

          user.id = dbUser.id;
          // Allow role to be null/undefined for new Google users so onboarding can handle it
          user.role = (dbUser.role ?? null) as Session["user"]["role"];
          user.onboardingComplete = dbUser.onboardingComplete;
          user.emailVerified = dbUser.emailVerified ?? null;
          user.businessName = dbUser.businessName ?? null;

          user.subscriptionTier = normalizeTier(dbUser.subscriptionTier);
          user.subscriptionStatus = normalizeStatus(dbUser.subscriptionStatus);

          logger.info("[auth.signIn] Enriched NextAuth user object (Google):", user);
        } catch (error) {
          logger.error("[auth.signIn] ERROR in signIn callback (Google):", error);
          return false;
        }
      } else if (account?.provider === "credentials") {
        // For credentials, the necessary details (role, tier, businessName etc.)
        // should already be populated by the `authorize` callback.
        logger.info("Credentials sign in - user object:", user);
      }

      logger.info("--- [auth.ts] signIn successful, returning true ---");
      return true;
    },

    // --- Keep the simplified authorized callback ---
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;

      logger.info(`[auth.authorized] Checking: isLoggedIn=${isLoggedIn}, pathname=${pathname}`);

      const isAuthRoute = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email"].some(route =>
        pathname.startsWith(route)
      );
      const isApiAuthRoute = pathname.startsWith("/api/auth");
      // Define protected routes as anything starting with /dashboard
      const isProtectedRoute = pathname.startsWith("/dashboard");

      if (isLoggedIn) {
        // If logged in, redirect away from auth pages to the main dashboard entry point
        if (isAuthRoute) {
          logger.info("[auth.authorized] Logged in user on auth route. Redirecting to /dashboard.");
          // Let the /dashboard page handle the role-specific redirect using fresh data
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
        // Allow access to all other routes (including dashboard sub-routes and API routes)
        // Role-specific access will be enforced by layout/page guards using requireSession/requireRole
        logger.info("[auth.authorized] Logged in user allowed access.");
        return true;
      } else {
        // If not logged in...
        // Allow access to auth routes, API auth routes, and public pages (anything NOT protected)
        if (isAuthRoute || isApiAuthRoute || !isProtectedRoute) {
          logger.info("[auth.authorized] Not logged in, access allowed.");
          return true;
        }
        // Redirect to login if trying to access a protected route
        logger.info("[auth.authorized] Not logged in, protected route. Redirecting to /login.");
        return Response.redirect(new URL("/login", nextUrl));
      }
    },
    // --- End of simplified authorized callback ---

    async jwt({ token, user, trigger, session }) {
      // Runs on initial sign-in

      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.name = user.name;
        token.picture = user.image;
        token.emailVerified = user.emailVerified;
        token.onboardingComplete = user.onboardingComplete;
        token.businessName = user.businessName ?? null;

        // Ensure token also uses the normalized types if user object has them
        token.subscriptionTier = normalizeTier(user.subscriptionTier);
        token.subscriptionStatus = normalizeStatus(user.subscriptionStatus);
        if (isDev) {
          logger.info("[auth.jwt] Initial token population:", token);
        }
      }

      // Runs when update() is called from client
      if (trigger === "update" && session?.user) {
        token.name = session.user.name;
        token.picture = session.user.image;
        // Optionally update other fields if passed in update()
        if (session.user.businessName !== undefined) {
          token.businessName = session.user.businessName;
        }
        if (session.user.subscriptionTier !== undefined) {
          token.subscriptionTier = normalizeTier(session.user.subscriptionTier);
        }
        if (session.user.subscriptionStatus !== undefined) {
          token.subscriptionStatus = normalizeStatus(session.user.subscriptionStatus);
        }
        if (isDev) {
          logger.info("[auth.jwt] Token updated via client trigger:", token);
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (!session.user) {
        return session;
      }

      // Always keep these base fields from the token
      session.user.id = token.id as string;
      session.user.role = token.role as Session["user"]["role"];
      session.user.name = token.name;
      session.user.image = token.picture as string | null;
      session.user.emailVerified = token.emailVerified as Date | null;
      session.user.onboardingComplete = token.onboardingComplete as boolean;
      session.user.businessName = token.businessName as string | null;

      // 🔑 Try to refresh from Firestore so Stripe updates are reflected
      // 🔑 Try to refresh from Firestore so Stripe updates are reflected
      try {
        const { userService } = await import("@/lib/services/user-service");
        const dbUser = await userService.getUserById(session.user.id);

        if (dbUser) {
          session.user.subscriptionTier = normalizeTier(dbUser.subscriptionTier);
          session.user.subscriptionStatus = normalizeStatus(dbUser.subscriptionStatus);

          session.user.businessName = dbUser.businessName ?? null;
          session.user.onboardingComplete = Boolean(dbUser.onboardingComplete);
          session.user.role = (dbUser.role ?? null) as Session["user"]["role"];
        } else {
          session.user.subscriptionTier =
            (token.subscriptionTier as Session["user"]["subscriptionTier"] | undefined) ?? "basic";
          session.user.subscriptionStatus = (token.subscriptionStatus as Session["user"]["subscriptionStatus"]) ?? null;

          logger.warn("[auth.session] No Firestore user found for session id, falling back to token", {
            userId: session.user.id
          });
        }
      } catch (error) {
        logger.error("[auth.session] Error refreshing user from Firestore, falling back to token:", error);
        session.user.subscriptionTier =
          (token.subscriptionTier as Session["user"]["subscriptionTier"] | undefined) ?? "basic";
        session.user.subscriptionStatus = (token.subscriptionStatus as Session["user"]["subscriptionStatus"]) ?? null;
      }

      if (isDev) {
        logger.info("[auth.session] Session enriched (with Firestore refresh):", session);
      }
      return session;
    }
  },

  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET
    }),
    Credentials({
      async authorize(credentials) {
        logger.info("[auth.authorize] Authorize callback triggered.");
        if (!credentials?.email || !credentials.password) {
          logger.info("[auth.authorize] Missing credentials.");
          return null;
        }

        logger.info(`[auth.authorize] Validating credentials for: ${credentials.email}`);
        // Lazily import userService ONLY for credential validation
        const { userService } = await import("@/lib/services/user-service");
        const u = await userService.validateCredentials(credentials.email as string, credentials.password as string);

        if (!u) {
          logger.info(`[auth.authorize] Invalid credentials for: ${credentials.email}`);
          const userExists = await userService.getUserByEmail(credentials.email as string);
          if (userExists && !userExists.emailVerified) {
            logger.info(`[auth.authorize] User exists but email is not verified: ${credentials.email}`);
            // Throw the custom error to be caught by loginAction
            throw new UnverifiedEmailError("Email has not been verified.");
          }
          return null; // For standard invalid credentials
        }

        logger.info(`[auth.authorize] Credentials valid for: ${credentials.email}`);

        // Double-check email verification status RIGHT before creating session
        if (!u.emailVerified) {
          logger.info(`[auth.authorize] LOGIN BLOCKED: Email not verified for ${u.email}`);
          // Throw the custom error
          throw new UnverifiedEmailError("Email has not been verified.");
        }

        logger.info(`[auth.authorize] User verified, returning user object for session creation.`);
        // Return the full user object needed to populate the JWT/Session
        return {
          id: u.id,
          email: u.email,
          name: u.name ?? null,
          image: u.profilePicture ?? u.image ?? null, // Prefer profilePicture if set
          role: (u.role as Session["user"]["role"]) ?? "customer",
          emailVerified: u.emailVerified,
          onboardingComplete: Boolean(u.onboardingComplete),
          businessName: u.businessName ?? null,
          // Use normalization here too when returning from authorize
          subscriptionTier: normalizeTier(u.subscriptionTier),
          subscriptionStatus: normalizeStatus(u.subscriptionStatus)
        };
      }
    })
  ],

  session: { strategy: "jwt" },
  secret: env.AUTH_SECRET || "insecure-development-secret"
});

// --- Exports ---
export const auth = nextAuthAuth;

// Keep getSessionSafe as is
export async function getSessionSafe(): Promise<Session | null> {
  try {
    // Attempt to get the session, casting as unknown first
    return await (nextAuthAuth as unknown as () => Promise<Session | null>)();
  } catch (error) {
    // Check specifically for JWTSessionError which might occur with stale/invalid tokens
    if (
      typeof error === "object" &&
      error !== null &&
      "name" in error &&
      (error as { name: string }).name === "JWTSessionError"
    ) {
      logger.info("[getSessionSafe] Caught JWTSessionError, returning null session.");
      // Return null instead of throwing, allowing graceful handling of invalid sessions
      return null;
    }
    // Re-throw other unexpected errors
    throw error;
  }
}

export { handlers, signIn, signOut };
