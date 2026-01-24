// src/app/(dashboard)/admin/page.tsx
import type { Metadata } from "next";
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
import { redirect } from "next/navigation";
import { getAdminFirestore } from "@/lib/firebase/admin/initialize";
import { UserService } from "@/lib/services/user-service";
import { serializeData } from "@/utils";
import type { SerializedActivity } from "@/types/firebase";

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

    const userId = session.user.id;
    const userRole = await UserService.getUserRole(userId);

    if (userRole !== "admin") {
      redirect("/not-authorized");
    }

    // Fetch activity logs using the new action
    const result = await fetchAllActivityLogs(10);
    console.log("[AdminDashboardOverviewPage] fetchActivityLogs result:", result);
    // Highlight: Directly use result.logs, no more mapping needed
    const logs: SerializedActivity[] = result.success ? result.logs : [];

    console.log("[AdminDashboardOverviewPage] Logs length:", logs.length);

    // Fetch system stats for the admin dashboard
    const systemStats = {
      totalUsers: 0,
      activeUsers: 0,
      newUsersToday: 0,
      totalActivities: 0
    };

    try {
      const db = getAdminFirestore();

      const usersSnapshot = await db.collection("users").count().get();
      systemStats.totalUsers = usersSnapshot.data().count;

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const activeUsersSnapshot = await db.collection("users").where("lastLoginAt", ">=", sevenDaysAgo).count().get();
      systemStats.activeUsers = activeUsersSnapshot.data().count;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const newUsersSnapshot = await db.collection("users").where("createdAt", ">=", today).count().get();
      systemStats.newUsersToday = newUsersSnapshot.data().count;

      const activitiesSnapshot = await db.collection("activity").count().get();
      systemStats.totalActivities = activitiesSnapshot.data().count;
      console.log("ACTIVITIES:", activitiesSnapshot.data().count);
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
