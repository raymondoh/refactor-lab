// src/types/next-auth/index.d.ts
import type { DefaultSession } from "next-auth";
import type { UserRole } from "../user/common"; // Assuming this path is correct

declare module "next-auth" {
  interface User {
    id: string;
    role: UserRole;
    bio?: string;
    // Highlight: Add new profile fields to NextAuth 'User' interface
    firstName?: string;
    lastName?: string;
    displayName?: string;
  }

  interface Session {
    user: {
      id: string;
      // Highlight: Add new profile fields to NextAuth 'Session.user' object
      firstName?: string;
      lastName?: string;
      displayName?: string;

      // Keep existing properties
      name?: string; // Keep this for compatibility if DefaultSession['user'] still uses it
      email: string;
      role: UserRole; // Corrected type usage
      bio?: string;
      image?: string;
    } & DefaultSession["user"]; // Merge with default session user properties
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid: string;
    role: UserRole;
    bio?: string;
    // Highlight: Add new profile fields to NextAuth 'JWT' interface
    firstName?: string;
    lastName?: string;
    displayName?: string;
  }
}
