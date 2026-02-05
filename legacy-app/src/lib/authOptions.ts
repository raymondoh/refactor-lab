// src/lib/authOptions.ts
import type { NextAuthConfig } from "next-auth";
import type { Adapter } from "next-auth/adapters";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { FirestoreAdapter } from "@auth/firebase-adapter";
import { cert } from "firebase-admin/app";
import { syncUserWithFirebase } from "./auth/syncUserWithFirebase";
import type { AdapterUser } from "next-auth/adapters";
import { handleProviderSync } from "./auth/sync";
import type { UserRole, User as FirestoreUser } from "@/types/models/user";

type ExtendedUser = AdapterUser & {
  sub?: string;
  bio?: string;
  picture?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
};

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
  } catch (error) {
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
  } catch (error) {
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
          if (!decodedRes.success) throw new Error("Invalid ID token");

          const decodedToken = decodedRes.data as any;
          const uid: string = decodedToken.uid;
          const email: string | undefined = decodedToken.email;

          if (!email) throw new Error("No email in token");

          const authUserRes = await adminAuthService.getAuthUserById(uid);
          if (!authUserRes.success) throw new Error("Invalid ID token");

          const authUser = authUserRes.data as any;
          const provider = decodedToken.firebase?.sign_in_provider || "unknown";

          const { role } = await syncUserWithFirebase(uid, {
            email,
            name: authUser.displayName || undefined,
            image: authUser.photoURL || undefined,
            provider
          });

          return {
            id: uid,
            email,
            name: authUser.displayName || email.split("@")[0],
            firstName: undefined,
            lastName: undefined,
            displayName: authUser.displayName || email.split("@")[0],
            image: authUser.photoURL || undefined,
            role
          };
        } catch (error) {
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
      // Ensure uid is always present
      if (!token.uid && token.sub) token.uid = token.sub;
      if (!token.uid && (user as any)?.id) token.uid = (user as any).id;

      // Apply session.update() patches
      if (trigger === "update" && session?.user) {
        const su = session.user as any;
        if (su.email) token.email = su.email;
        if (su.name) token.name = su.name;
        if (su.image) token.picture = su.image;
        if (su.bio) token.bio = su.bio;
        if (su.firstName) token.firstName = su.firstName;
        if (su.lastName) token.lastName = su.lastName;
        if (su.displayName) token.displayName = su.displayName;
      } else {
        const extendedUser = user as ExtendedUser;
        if (extendedUser?.email) token.email = extendedUser.email;
        if (extendedUser?.name) token.name = extendedUser.name;
        if (extendedUser?.picture) token.picture = extendedUser.picture;
        if (extendedUser?.bio) token.bio = extendedUser.bio;
        if (extendedUser?.firstName) token.firstName = extendedUser.firstName;
        if (extendedUser?.lastName) token.lastName = extendedUser.lastName;
        if (extendedUser?.displayName) token.displayName = extendedUser.displayName;
      }

      // Provider sync ONLY on sign-in (sets token.uid/role)
      if (user && account) {
        try {
          const { role, uid } = await handleProviderSync(user as ExtendedUser, account);
          token.uid = uid;
          token.role = role;
        } catch (error) {
          console.error(`[NextAuth jwt] Error syncing ${account.provider}:`, error);
        }
      }

      // ✅ Firestore sync ONLY on sign-in OR explicit update
      const shouldSync = Boolean(user && account) || trigger === "update";

      if (token.uid && shouldSync) {
        try {
          const { userRepo } = await import("@/lib/repos/user-repo");
          const userRes = await userRepo.getUserById(token.uid as string);

          if (userRes.success && userRes.data?.user) {
            const firestoreUser = userRes.data.user;

            token.firstName = firestoreUser.firstName;
            token.lastName = firestoreUser.lastName;
            token.displayName = firestoreUser.displayName;
            token.bio = (firestoreUser as any).bio;

            token.email = firestoreUser.email || token.email;

            token.picture =
              (firestoreUser as any).picture ||
              (firestoreUser as any).image ||
              (firestoreUser as any).photoURL ||
              token.picture;

            token.name = (firestoreUser as any).name || firestoreUser.displayName || token.name;
            token.role = (firestoreUser as any).role || token.role;
          }
        } catch (e) {
          console.error("[NextAuth jwt] Firestore sync via userRepo failed:", e);
        }
      }

      return token;
    },

    async session({ session, token }) {
      const isValidRole = (role: unknown): role is UserRole => role === "admin" || role === "user";

      try {
        if (token && session.user) {
          session.user.id = token.uid as string;
          session.user.email = token.email as string;
          session.user.role = isValidRole(token.role) ? token.role : "user";

          session.user.firstName = token.firstName as string | undefined;
          session.user.lastName = token.lastName as string | undefined;
          session.user.displayName = token.displayName as string | undefined;

          session.user.name = token.name as string | undefined;
          session.user.image = token.picture as string | undefined;
          session.user.bio = token.bio as string | undefined;
        }
      } catch (error) {
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
