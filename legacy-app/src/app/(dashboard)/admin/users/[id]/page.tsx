import { DashboardShell, DashboardHeader } from "@/components";
import { Separator } from "@/components/ui/separator";
import { redirect } from "next/navigation";
import { AdminUserTabs } from "@/components/dashboard/admin/users/AdminUserTabs";

// ✅ NEW
import { adminUserService } from "@/lib/services/admin-user-service";

export default async function AdminUserTabsPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const userId = resolvedParams.id;

    // Dynamic import for auth to avoid build-time issues
    const { auth } = await import("@/auth");

    // 1) Ensure user is signed in
    const session = await auth();
    if (!session?.user) {
      redirect("/login");
    }

    // 2) Fetch the target user (service is admin-gated)
    const userResult = await adminUserService.getUserById(userId);

    if (!userResult.ok) {
      // Handle unauthorized / not found (service should provide status)
      if (userResult.status === 401) redirect("/login");
      if (userResult.status === 403) redirect("/not-authorized");

      // Not found or other errors: go back to users list
      redirect("/admin/users");
    }

    const user = userResult.data.user;

    // 3) Render the dashboard shell + tabs
    return (
      <DashboardShell>
        <DashboardHeader
          title="User Details"
          description={`View and manage details for ${user.name || user.email || "user"}.`}
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "Admin", href: "/admin" },
            { label: "Users", href: "/admin/users" },
            { label: "User Details" }
          ]}
        />
        <Separator className="mb-8" />

        <div className="w-full max-w-full overflow-hidden">
          <AdminUserTabs user={user} />
        </div>
      </DashboardShell>
    );
  } catch (error) {
    console.error("Error in AdminUserTabsPage:", error);
    redirect("/login");
  }
}
