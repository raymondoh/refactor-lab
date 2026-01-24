// src/app/dashboard/business-owner/layout.tsx
import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/require-session";

export default async function BusinessOwnerLayout({ children }: { children: ReactNode }) {
  const session = await requireSession();
  const allowedRoles = ["business_owner", "admin"] as const;

  if (!allowedRoles.includes(session.user.role as (typeof allowedRoles)[number])) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
