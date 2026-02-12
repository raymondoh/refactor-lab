import type { Metadata } from "next";
import { Separator } from "@/components/ui/separator";
import { DashboardShell, DashboardHeader } from "@/components";
import { UsersClient } from "@/components/dashboard/admin/users/UsersClient";
import { redirect } from "next/navigation";
import type { SerializedUser } from "@/types/models/user";

// ✅ Use the admin service (admin-gated, already returns serialized users)
import { adminUserService } from "@/lib/services/admin-user-service";

export const metadata: Metadata = {
  title: "Manage Users - Admin",
  description: "View and manage all users in your application."
};

export default async function AdminUsersPage() {
  try {
    const { auth } = await import("@/auth");
    const session = await auth();

    if (!session?.user) {
      redirect("/login");
    }

    // ✅ simplest + cheapest admin gate (consistent with other admin pages)
    if (session.user.role !== "admin") {
      redirect("/not-authorized");
    }

    // ✅ Fetch users via admin service (avoids UserService.getUserRole issues)
    const usersResult = await adminUserService.listUsers(10, 0);

    if (!usersResult.success) {
      console.error("Error fetching users:", usersResult.error);
      return (
        <DashboardShell>
          <DashboardHeader
            title="User Management"
            description="View and manage users in your application."
            breadcrumbs={[{ label: "Home", href: "/" }, { label: "Admin", href: "/admin" }, { label: "Users" }]}
          />
          <Separator className="mb-8" />
          <div className="p-4 bg-red-50 text-red-500 rounded-md">Error loading users: {usersResult.error}</div>
        </DashboardShell>
      );
    }

    const users: SerializedUser[] = usersResult.data.users;
    console.log("🚀 Fetched users:", users.length);

    return (
      <DashboardShell>
        <DashboardHeader
          title="User Management"
          description="View and manage users in your application."
          breadcrumbs={[{ label: "Home", href: "/" }, { label: "Admin", href: "/admin" }, { label: "Users" }]}
        />
        <Separator className="mb-8" />

        <div className="w-full overflow-hidden">
          <UsersClient users={users} />
        </div>
      </DashboardShell>
    );
  } catch (error) {
    console.error("Error in AdminUsersPage:", error);
    redirect("/login");
  }
}
