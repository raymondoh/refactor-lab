// src/lib/authOptions.ts
import type { NextAuthConfig } from "next-auth";
import type { Adapter, AdapterUser } from "next-auth/adapters";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { FirestoreAdapter } from "@auth/firebase-adapter";
import { cert } from "firebase-admin/app";

import { syncUserWithFirebase } from "./auth/syncUserWithFirebase";
import { handleProviderSync } from "./auth/sync";

import type { UserRole, User as FirestoreUser } from "@/types/models/user";

type ExtendedUser = AdapterUser & {
  sub?: string;
  bio?: string;
  picture?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  role?: UserRole;
};

type TokenShape = {
  uid?: string;
  sub?: string;

  email?: string;
  name?: string;
  picture?: string;

  bio?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;

  role?: unknown;
};

function asTokenShape(token: unknown): TokenShape {
  return (token ?? {}) as TokenShape;
}

function isUserRole(role: unknown): role is UserRole {
  return role === "admin" || role === "user";
}

function getString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function getFirstString(...values: unknown[]): string | undefined {
  for (const v of values) {
    const s = getString(v);
    if (s) return s;
  }
  return undefined;
}

// Build-safe Firebase Admin config function
function getFirebaseAdminConfig() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyEnv = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKeyEnv) {
    console.error("Missing Firebase Admin credentials in authOptions.ts");
    return null;
  }

  let privateKey = "";
  try {
    privateKey = privateKeyEnv.replace(/\\n/g, "\n");
  } catch (error: unknown) {
    console.error("Error processing FIREBASE_PRIVATE_KEY:", error);
    return null;
  }

  return {
    credential: cert({
      projectId,
      clientEmail,
      privateKey
    })
  };
}

// Build-safe adapter creation
function createFirestoreAdapter(): Adapter | undefined {
  const config = getFirebaseAdminConfig();
  if (!config) {
    console.warn("Skipping FirestoreAdapter creation due to missing config");
    return undefined;
  }

  try {
    return FirestoreAdapter(config) as Adapter;
  } catch (error: unknown) {
    console.error("Failed to create FirestoreAdapter:", error);
    return undefined;
  }
}

export const authOptions: NextAuthConfig = {
  basePath: "/api/auth",
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_CLIENT_ID,
      clientSecret: process.env.AUTH_GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),

    CredentialsProvider({
      name: "Firebase",
      credentials: {
        idToken: { label: "ID Token", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.idToken || typeof credentials.idToken !== "string") {
          throw new Error("Invalid ID token");
        }

        try {
          const { adminAuthService } = await import("@/lib/services/admin-auth-service");

          const decodedRes = await adminAuthService.verifyIdToken(credentials.idToken);
          if (!decodedRes.ok) throw new Error("Invalid ID token");

          // decodedRes.data is unknown-ish; narrow safely
          const decodedToken = decodedRes.data as unknown;
          const uid = getString((decodedToken as { uid?: unknown })?.uid);
          const email = getString((decodedToken as { email?: unknown })?.email);

          if (!uid) throw new Error("No uid in token");
          if (!email) throw new Error("No email in token");

          const authUserRes = await adminAuthService.getAuthUserById(uid);
          if (!authUserRes.ok) throw new Error("Invalid ID token");

          const authUser = authUserRes.data as unknown;
          const displayName = getString((authUser as { displayName?: unknown })?.displayName);
          const photoURL = getString((authUser as { photoURL?: unknown })?.photoURL);

          const provider =
            getString(
              (decodedToken as { firebase?: unknown })?.firebase &&
                (decodedToken as { firebase?: { sign_in_provider?: unknown } }).firebase?.sign_in_provider
            ) || "unknown";

          const { role } = await syncUserWithFirebase(uid, {
            email,
            name: displayName || undefined,
            image: photoURL || undefined,
            provider
          });

          return {
            id: uid,
            email,
            emailVerified: null,
            name: displayName || email.split("@")[0],
            firstName: undefined,
            lastName: undefined,
            displayName: displayName || email.split("@")[0],
            image: photoURL || undefined,
            role
          } satisfies ExtendedUser;
        } catch (error: unknown) {
          console.error("Error verifying Firebase ID token:", error);
          throw new Error("Invalid ID token");
        }
      }
    })
  ],

  adapter: createFirestoreAdapter(),

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60
  },

  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      const t = asTokenShape(token);

      // Ensure uid is always present
      if (!t.uid && t.sub) t.uid = t.sub;
      const maybeUserId = getString((user as { id?: unknown } | null)?.id);
      if (!t.uid && maybeUserId) t.uid = maybeUserId;

      // Apply session.update() patches
      if (trigger === "update" && session?.user) {
        const su = session.user as unknown as {
          email?: unknown;
          name?: unknown;
          image?: unknown;
          bio?: unknown;
          firstName?: unknown;
          lastName?: unknown;
          displayName?: unknown;
        };

        const email = getString(su.email);
        const name = getString(su.name);
        const image = getString(su.image);
        const bio = getString(su.bio);
        const firstName = getString(su.firstName);
        const lastName = getString(su.lastName);
        const displayName = getString(su.displayName);

        if (email) t.email = email;
        if (name) t.name = name;
        if (image) t.picture = image;
        if (bio) t.bio = bio;
        if (firstName) t.firstName = firstName;
        if (lastName) t.lastName = lastName;
        if (displayName) t.displayName = displayName;
      } else {
        const u = user as ExtendedUser | null;

        if (u?.email) t.email = u.email;
        if (u?.name) t.name = u.name;
        if (u?.picture) t.picture = u.picture;
        if (u?.bio) t.bio = u.bio;
        if (u?.firstName) t.firstName = u.firstName;
        if (u?.lastName) t.lastName = u.lastName;
        if (u?.displayName) t.displayName = u.displayName;
      }

      // Provider sync ONLY on sign-in (sets token.uid/role)
      if (user && account) {
        try {
          const { role, uid } = await handleProviderSync(user as ExtendedUser, account);
          t.uid = uid;
          t.role = role;
        } catch (error: unknown) {
          console.error(`[NextAuth jwt] Error syncing ${account.provider}:`, error);
        }
      }

      // ✅ Firestore sync ONLY on sign-in OR explicit update
      const shouldSync = Boolean(user && account) || trigger === "update";

      if (t.uid && shouldSync) {
        try {
          const { userRepo } = await import("@/lib/repos/user-repo");
          const userRes = await userRepo.getUserById(t.uid);

          if (userRes.ok && userRes.data?.user) {
            const firestoreUser = userRes.data.user as FirestoreUser;

            t.firstName = firestoreUser.firstName ?? undefined;
            t.lastName = firestoreUser.lastName ?? undefined;
            t.displayName = firestoreUser.displayName ?? undefined;

            // optional fields might exist depending on your model
            const fu = firestoreUser as unknown as Record<string, unknown>;

            t.bio = getString(fu.bio);
            t.email = firestoreUser.email || t.email;

            t.picture = getFirstString(fu.picture, fu.image, fu.photoURL, t.picture);
            t.name = getFirstString(fu.name, firestoreUser.displayName, t.name);
            t.role = fu.role ?? t.role;
          }
        } catch (error: unknown) {
          console.error("[NextAuth jwt] Firestore sync via userRepo failed:", error);
        }
      }

      return token;
    },

    async session({ session, token }) {
      const t = asTokenShape(token);

      try {
        if (session.user) {
          session.user.id = (t.uid ?? "") as string;
          session.user.email = (t.email ?? "") as string;
          session.user.role = isUserRole(t.role) ? t.role : "user";

          session.user.firstName = t.firstName;
          session.user.lastName = t.lastName;
          session.user.displayName = t.displayName;

          session.user.name = t.name;
          session.user.image = t.picture;
          session.user.bio = t.bio;
        }
      } catch (error: unknown) {
        console.error("[NextAuth session] Error building session:", error);
      }

      return session;
    }
  },

  pages: {
    signIn: "/login",
    error: "/login"
  },

  events: {
    async signIn({ user, account }) {
      console.log(`User signed in with ${account?.provider}:`, user.email);
    },
    async signOut(message) {
      if ("session" in message) {
        console.log("User signed out with session:", message.session);
      }
      if ("token" in message) {
        console.log("User signed out with token:", message.token);
      }
    }
  },

  debug: process.env.NODE_ENV === "development",

  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production"
      }
    }
  }
};
