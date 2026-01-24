// src/app/(dashboard)/admin/activity/page.tsx
import type { Metadata } from "next";
import { Separator } from "@/components/ui/separator";
import { DashboardShell, DashboardHeader } from "@/components";
import { AdminActivityPageClient } from "@/components";
import { redirect } from "next/navigation";
import { fetchAllActivityLogs } from "@/actions/dashboard";
import { UserService } from "@/lib/services/user-service";
import type { Firebase } from "@/types"; // Make sure Firebase type is correctly imported from types/firebase

export const metadata: Metadata = {
  title: "Activity Log - Admin",
  description: "View all recent activity across the platform."
};

export default async function AdminActivityPage() {
  try {
    const { auth } = await import("@/auth");
    const session = await auth();

    if (!session?.user) {
      redirect("/login");
    }

    const userRole = await UserService.getUserRole(session.user.id);
    if (userRole !== "admin") {
      redirect("/not-authorized");
    }

    // ✅ Fetch initial logs on the server. fetchActivityLogs now returns SerializedActivity[]
    const result = await fetchAllActivityLogs(10);

    // Highlight: Directly use result.logs, no more mapping needed
    const logs: Firebase.SerializedActivity[] = result.success ? result.logs : [];
    console.log("LOGS:", logs);

    console.log("[AdminActivityPage] Logs length:", logs.length);

    return (
      <DashboardShell>
        <DashboardHeader
          title="Activity Log"
          description="View all recent activity across the platform."
          breadcrumbs={[{ label: "Home", href: "/" }, { label: "Admin", href: "/admin" }, { label: "Activity Log" }]}
        />
        <Separator className="mb-8" />

        <div className="w-full max-w-full overflow-hidden">
          <AdminActivityPageClient initialLogs={logs} />
        </div>
      </DashboardShell>
    );
  } catch (error) {
    console.error("Error in AdminActivityPage:", error);
    redirect("/login");
  }
}
