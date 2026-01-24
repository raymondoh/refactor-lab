// src/app/dashboard/customer/layout.tsx
import { ReactNode } from "react";
import { requireAnyRole } from "@/lib/auth/guards";

export default async function CustomerDashboardLayout({ children }: { children: ReactNode }) {
  // This guard protects the entire /dashboard/customer route segment.
  // It allows customers and admins, and redirects all others (like tradespeople).
  await requireAnyRole(["customer", "admin"]);

  return <>{children}</>;
}
