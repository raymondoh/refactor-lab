// src/auth.config.ts
import type { NextAuthConfig } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

type TokenShape = {
  uid?: string;
  sub?: string;
  role?: unknown;
  email?: string;
  name?: string;
  picture?: string;
};

function asTokenShape(token: unknown): TokenShape {
  return (token ?? {}) as TokenShape;
}

function isUserRole(role: unknown): role is "admin" | "user" {
  return role === "admin" || role === "user";
}

export const authConfig = {
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
    })
  ],

  pages: {
    signIn: "/login",
    error: "/login"
  },

  session: { strategy: "jwt" },

  callbacks: {
    authorized() {
      return true;
    },

    // Edge-safe: just keep uid/role stable if they already exist in the token
    async jwt({ token }) {
      const t = asTokenShape(token);
      if (!t.uid && t.sub) t.uid = t.sub;
      return token;
    },

    // Edge-safe: project token.role -> session.user.role so middleware can read it
    async session({ session, token }) {
      const t = asTokenShape(token);

      if (session.user) {
        // id is useful for your app + middleware checks
        (session.user as any).id = (t.uid ?? t.sub ?? "") as string;

        // role is critical for /admin gating
        (session.user as any).role = isUserRole(t.role) ? t.role : "user";

        // optional, but nice to keep stable
        if (t.email) session.user.email = t.email as string;
        if (t.name) session.user.name = t.name as string;
        (session.user as any).image = (t.picture ?? (session.user as any).image) as string | undefined;
      }

      return session;
    }
  }
} satisfies NextAuthConfig;
