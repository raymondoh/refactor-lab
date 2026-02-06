// src/app/(dashboard)/admin/activity/page.tsx
import type { Metadata } from "next";
import { Separator } from "@/components/ui/separator";
import { DashboardShell, DashboardHeader } from "@/components";
import { AdminActivityPageClient } from "@/components";
import { redirect } from "next/navigation";
import { fetchAllActivityLogs } from "@/actions/dashboard";
import type { Firebase } from "@/types"; // keep your existing Firebase namespace import

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

    // ✅ simplest + cheapest admin gate (avoid UserService.getUserRole crash)
    if (session.user.role !== "admin") {
      redirect("/not-authorized");
    }

    // ✅ Fetch initial logs on the server (already enriched/serialized by your action)
    const result = await fetchAllActivityLogs(100);

    const logs: Firebase.SerializedActivity[] = result.success ? result.logs : [];
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
