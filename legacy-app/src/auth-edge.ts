// src/auth-edge.ts
import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Edge-safe: MUST NOT import authFullOptions (firebase-admin)
export const { auth } = NextAuth(authConfig);
