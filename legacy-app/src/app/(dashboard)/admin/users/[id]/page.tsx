import { DashboardShell, DashboardHeader } from "@/components";
import { Separator } from "@/components/ui/separator";
import { redirect } from "next/navigation";
import { getAdminFirestore } from "@/lib/firebase/admin/initialize";
import { AdminUserTabs } from "@/components/dashboard/admin/users/AdminUserTabs";
import { serializeUser } from "@/utils/serializeUser";

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

    // 2) Check current user is an admin
    const currentUserId = session.user.id;
    let isAdmin = false;
    try {
      const currentUserDoc = await getAdminFirestore().collection("users").doc(currentUserId).get();
      if (currentUserDoc.exists && currentUserDoc.data()?.role === "admin") {
        isAdmin = true;
      }
      if (!isAdmin) {
        redirect("/not-authorized");
      }
    } catch (err) {
      console.error("Error checking admin status:", err);
      redirect("/not-authorized");
    }

    // 3) Fetch the target user
    const userDoc = await getAdminFirestore().collection("users").doc(userId).get();
    if (!userDoc.exists) {
      redirect("/admin/users");
    }

    const rawData = { id: userDoc.id, ...(userDoc.data() || {}) };
    const serializedUser = serializeUser(rawData);

    // 4) Render the dashboard shell + tabs
    return (
      <DashboardShell>
        <DashboardHeader
          title="User Details"
          description={`View and manage details for ${serializedUser.name || serializedUser.email || "user"}.`}
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "Admin", href: "/admin" },
            { label: "Users", href: "/admin/users" },
            { label: "User Details" }
          ]}
        />
        <Separator className="mb-8" />

        <div className="w-full max-w-full overflow-hidden">
          <AdminUserTabs user={serializedUser} />
        </div>
      </DashboardShell>
    );
  } catch (error) {
    console.error("Error in AdminUserTabsPage:", error);
    redirect("/login");
  }
}
