// src/app/dashboard/page.tsx
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/require-session";
import { userService } from "@/lib/services/user-service";
import { logger } from "@/lib/logger";

type AppUser = Awaited<ReturnType<typeof requireSession>>["user"] & { uid?: string };

export default async function DashboardRootPage() {
  logger.info("[/dashboard page] Calling requireSession...");
  const session = await requireSession();
  const userSession = session.user as AppUser; // safe, typed

  if (!userSession) {
    redirect("/login");
  }

  const userId = userSession.uid ?? userSession.id;
  logger.info(`[/dashboard page] Fetching Firestore user for id: ${userId}`);

  const user = await userService.getUserById(userId);
  if (!user) redirect("/login");

  if (!user.role) redirect("/onboarding/select-role");

  logger.info(`[/dashboard page] Redirecting dashboard for role: ${user.role}`);

  const routeMap: Record<string, string> = {
    admin: "/dashboard/admin",
    tradesperson: "/dashboard/tradesperson",
    business_owner: "/dashboard/business-owner",
    customer: "/dashboard/customer",
    manager: "/dashboard/admin" // optional
  };

  return redirect(routeMap[user.role] ?? "/login");
}
