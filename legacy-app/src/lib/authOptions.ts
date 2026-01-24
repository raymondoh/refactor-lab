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
import type { UserRole } from "@/types/user";
import type { User as FirestoreUser } from "@/types/user/common";

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
          // After
          const { getAdminAuth } = await import("@/lib/firebase/admin/initialize");

          const decodedToken = await getAdminAuth().verifyIdToken(credentials.idToken);
          const uid = decodedToken.uid;
          const email = decodedToken.email;

          if (!email) throw new Error("No email in token");

          const userRecord = await getAdminAuth().getUser(uid);
          const provider = decodedToken.firebase?.sign_in_provider || "unknown";

          const { role } = await syncUserWithFirebase(uid, {
            email,
            name: userRecord.displayName || undefined,
            image: userRecord.photoURL || undefined,
            provider
          });

          return {
            id: uid,
            email,
            name: userRecord.displayName || email.split("@")[0],
            firstName: undefined,
            lastName: undefined,
            displayName: userRecord.displayName || email.split("@")[0],
            image: userRecord.photoURL || undefined,
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
    async jwt({ token, user, account }) {
      console.log("[NextAuth Callback] JWT: START");
      console.log("  Initial token:", token);
      console.log("  User object (from provider/adapter):", user);
      console.log("  Account object:", account);

      // Highlight: Dynamic import adminAuth/adminDb here as well for usage in jwt callback
      const { getAdminFirestore } = await import("@/lib/firebase/admin/initialize"); // Dynamically import getAdminFirestore

      // Highlight: Move Firestore data fetching OUTSIDE the 'if (user && account)' block.
      // This ensures it runs on every JWT callback, including session refreshes.
      if (token.uid) {
        // Only fetch if we have a UID in the token
        try {
          const userDoc = await getAdminFirestore()
            .collection("users")
            .doc(token.uid as string)
            .get();
          const firestoreData = userDoc.data() as FirestoreUser | undefined;

          if (firestoreData) {
            token.firstName = firestoreData.firstName;
            token.lastName = firestoreData.lastName;
            token.displayName = firestoreData.displayName;
            token.bio = firestoreData.bio;
            token.email = firestoreData.email || token.email; // Ensure email is also updated from Firestore
            token.picture = firestoreData.picture || firestoreData.image || firestoreData.photoURL;
            // You might also want to update 'name' from Firestore if it's your primary display name fallback
            token.name = firestoreData.name || firestoreData.displayName || token.name;
            console.log("[NextAuth Callback] JWT: Firestore data fetched and assigned to token:", firestoreData);
          }
        } catch (error) {
          console.error("[NextAuth Callback] JWT: Error fetching user data from Firestore:", error); // Highlight
        }
      }

      // This block will now only handle data coming directly from a new login or provider sync
      if (user && account) {
        try {
          // handleProviderSync already fetches/syncs user data, but we re-fetch from Firestore above
          // to ensure all custom fields are always picked up reliably.
          const { role, uid } = await handleProviderSync(user as ExtendedUser, account);
          token.uid = uid;
          token.role = role;
          // No need to re-assign firstName, lastName etc. from user here as they are covered by Firestore fetch above
        } catch (error) {
          console.error(`[NextAuth Callback] JWT: Error syncing ${account.provider} user with Firebase:`, error);
        }
      }

      // This part ensures that if 'user' object is populated (e.g. from session.update({ user: { newField: 'value' } }))
      // those direct updates are also applied to the token.
      const extendedUser = user as ExtendedUser;
      if (extendedUser?.email) token.email = extendedUser.email;
      if (extendedUser?.name) token.name = extendedUser.name;
      if (extendedUser?.picture) token.picture = extendedUser.picture;
      if (extendedUser?.bio) token.bio = extendedUser.bio;
      if (extendedUser?.firstName) token.firstName = extendedUser.firstName;
      if (extendedUser?.lastName) token.lastName = extendedUser.lastName;
      if (extendedUser?.displayName) token.displayName = extendedUser.displayName;

      console.log("[NextAuth Callback] JWT: Final token:", token);
      return token;
    },

    async session({ session, token }) {
      console.log("[NextAuth Callback] Session: START");
      console.log("  Initial session:", session);
      console.log("  Token object (from JWT callback):", token);

      const isValidRole = (role: unknown): role is UserRole => role === "admin" || role === "user";

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

        console.log("[NextAuth Callback] Session: Final session.user:", session.user);
      } else {
        console.warn("[NextAuth Callback] Session: Token or session.user missing.");
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
