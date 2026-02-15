// legacy-app/src/app/(dashboard)/admin/page.tsx
import type { Metadata } from "next";
import { siteConfig } from "@/config/siteConfig";
import { redirect } from "next/navigation";

import { fetchAllActivityLogs } from "@/actions/dashboard";
import { Separator } from "@/components/ui/separator";
import {
  DashboardShell,
  DashboardHeader,
  AdminSystemPreview,
  AdminAlertsPreview,
  AdminUserPreview,
  AdminActivityPreview
} from "@/components";
import { serializeData } from "@/utils";
import type { SerializedActivity } from "@/types/firebase";

// ✅ Services (only keep what you actually use in this file)
import { adminUserService } from "@/lib/services/admin-user-service";
import { adminActivityService } from "@/lib/services/admin-activity-service";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Admin Dashboard"
};

export default async function AdminDashboardOverviewPage() {
  try {
    const { auth } = await import("@/auth");
    const session = await auth();

    if (!session?.user) {
      redirect("/login");
    }

    // ✅ simplest + cheapest admin gate
    if (session.user.role !== "admin") {
      redirect("/not-authorized");
    }

    // Fetch activity logs
    const result = await fetchAllActivityLogs(10);
    const logs: SerializedActivity[] = result.success ? result.logs : [];

    // System stats
    const systemStats = {
      totalUsers: 0,
      activeUsers: 0,
      newUsersToday: 0,
      totalActivities: 0
    };

    try {
      // ✅ Users stats via service
      const stats = await adminUserService.getAdminUserStats();
      if (!stats.ok) {
        console.error("Error fetching admin user stats:", stats.error);
      } else {
        const { totalUsers } = stats.data;
        systemStats.totalUsers = totalUsers;
      }

      // ✅ Activity count via service
      const activityCountResult = await adminActivityService.countAll();
      systemStats.totalActivities = activityCountResult.ok ? activityCountResult.data.total : 0;

      if (!activityCountResult.ok) {
        console.error("Error fetching activity count:", activityCountResult.error);
      }
    } catch (error) {
      console.error("Error fetching system stats:", error);
    }

    const serializedSystemStats = serializeData(systemStats);

    const adminName = session.user.name || (session.user.email ? session.user.email.split("@")[0] : "Admin");

    return (
      <DashboardShell>
        <DashboardHeader
          title="Admin Dashboard"
          description={`Welcome, ${adminName}! Here's an overview of your system.`}
          breadcrumbs={[{ label: "Home", href: "/" }, { label: "Admin" }]}
        />
        <Separator className="mb-8" />

        <div className="w-full grid gap-4 md:gap-8 md:grid-cols-2 mb-4 md:mb-8">
          <div className="w-full min-w-0 overflow-hidden">
            <AdminSystemPreview systemStats={serializedSystemStats} />
          </div>

          <div className="w-full min-w-0 overflow-hidden">
            <AdminAlertsPreview />
          </div>
        </div>

        <div className="w-full grid gap-4 md:gap-8 md:grid-cols-2">
          <div className="w-full min-w-0 overflow-hidden">
            <AdminUserPreview limit={5} />
          </div>

          <div className="w-full min-w-0 overflow-hidden">
            <AdminActivityPreview
              activities={logs}
              limit={5}
              showFilters={false}
              showHeader={true}
              showViewAll={true}
              viewAllUrl="/admin/activity"
            />
          </div>
        </div>
      </DashboardShell>
    );
  } catch (error) {
    console.error("Error in AdminDashboardOverviewPage:", error);
    redirect("/login");
  }
}
