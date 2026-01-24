// src/app/dashboard/customer/layout.tsx
import { ReactNode } from "react";
import { canAccess, SERVICE_ROLES } from "@/lib/auth/roles";
import { requireSession } from "@/lib/auth/require-session";
import { redirect } from "next/navigation";

export default async function TradespersonDashboardLayout({ children }: { children: ReactNode }) {
  const session = await requireSession();

  // 🔐 Only allow tradesperson, business_owner and admin
  if (!canAccess(session.user.role, SERVICE_ROLES)) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
