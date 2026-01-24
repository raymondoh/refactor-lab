// src/lib/auth-utils.ts
import type { Session } from "next-auth";
export function getDashboardRoute(role?: string): string {
  switch (role) {
    case "admin":
      return "/dashboard/admin";
    case "tradesperson":
      return "/dashboard/tradesperson";
    case "business_owner":
      return "/dashboard/business-owner";
    case "customer":
      return "/dashboard/customer";
    default:
      return "/dashboard";
  }
}

export async function getCurrentUser(): Promise<Session["user"] | undefined> {
  const { auth } = await import("../auth");
  const session: Session | null = await auth();
  return session?.user;
}

export async function requireAuth(): Promise<Session["user"]> {
  const { auth } = await import("../auth");
  const session: Session | null = await auth();
  if (!session?.user) {
    throw new Error("Authentication required");
  }
  return session.user;
}
