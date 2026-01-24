// src/components/providers/session-provider.tsx
"use client";

import type React from "react";
import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import type { Session } from "next-auth";

interface Props {
  children: React.ReactNode;
  session?: Session | null; // Made optional with ?
}

export default function SessionProvider({ children, session }: Props) {
  return <NextAuthSessionProvider session={session}>{children}</NextAuthSessionProvider>;
}
