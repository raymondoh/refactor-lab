import { ReactNode } from "react";
import { requireRole } from "@/lib/auth/guards";

export default async function AdminDashboardLayout({ children }: { children: ReactNode }) {
  // This guard protects the entire /dashboard/admin route segment.
  // It allows ONLY admins and redirects all other roles.
  await requireRole("admin");

  return <>{children}</>;
}
