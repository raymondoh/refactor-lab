// src/auth.ts
import NextAuth from "next-auth";
import { authFullOptions } from "@/lib/auth-full-options";

export const { handlers, auth, signIn, signOut } = NextAuth(authFullOptions);
