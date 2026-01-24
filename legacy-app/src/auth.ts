// src/auth.ts
import NextAuth from "next-auth";
import { authOptions } from "@/lib/authOptions";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authOptions,
  basePath: "/api/auth",
  debug: process.env.NODE_ENV === "development"
});
