import { redirect } from "next/navigation";
import { parseServerDate } from "@/utils/date-server";
import type { User, SerializedUser } from "@/types/user";
import { serializeUser } from "@/utils/serializeUser";
import { fetchUserActivityLogs } from "@/actions/dashboard";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { UserAccountPreview } from "@/components/dashboard/user/overview/UserAccountPreview";
import { UserActivityPreview } from "@/components";
import { Clock, UserIcon } from "lucide-react";
import type { Firebase } from "@/types";
import { userProfileService } from "@/lib/services/user-profile-service";

// Helper function to convert ActivityLog to SerializedActivity
function convertToSerializedActivity(log: any): Firebase.SerializedActivity {
  return {
    id: log.id,
    userId: log.userId,
    type: log.type,
    description: log.description,
    status: log.status,
    timestamp: log.timestamp instanceof Date ? log.timestamp.toISOString() : log.timestamp,
    metadata: log.metadata || {},
    name: log.description || log.type
  };
}

export default async function UserDashboardOverviewPage() {
  try {
    const { auth } = await import("@/auth");
    const session = await auth();

    if (!session?.user) {
      redirect("/login");
    }

    const userId = session.user.id;
    const sessionUser = session.user as User;

    // Activity logs
    const activityResult = await fetchUserActivityLogs(userId, 5);
    const logs: Firebase.SerializedActivity[] = activityResult.success
      ? activityResult.logs.map(convertToSerializedActivity)
      : [];

    // Start with session values as a fallback shape
    let userData: User = {
      id: userId,
      name: sessionUser.name ?? "",
      email: sessionUser.email ?? "",
      image: sessionUser.image ?? "",
      role: sessionUser.role,
      emailVerified: sessionUser.emailVerified ?? false,
      hasPassword: false,
      has2FA: false,
      createdAt: new Date(),
      lastLoginAt: new Date(),
      updatedAt: new Date()
    };

    // ✅ Replace Firestore doc fetch with service call
    const profileResult = await userProfileService.getMyProfile();

    if (!profileResult.success) {
      // If your service returns status codes, you can branch.
      // For now, keep same behavior: unauth / not found => login
      redirect("/login");
    }

    // Expecting: { success: true, data: { user: ... } }
    const serviceUser = profileResult.data.user as Partial<User>;

    userData = {
      ...userData,
      ...serviceUser,
      createdAt: parseServerDate(serviceUser.createdAt) ?? userData.createdAt,
      lastLoginAt: parseServerDate(serviceUser.lastLoginAt) ?? userData.lastLoginAt,
      updatedAt: parseServerDate(serviceUser.updatedAt) ?? userData.updatedAt,
      hasPassword: !!(serviceUser as any).passwordHash || (serviceUser as any).provider !== "google",
      has2FA: (serviceUser as any).has2FA ?? false
    };

    const serializedUserData: SerializedUser = serializeUser(userData);
    const userName = serializedUserData.name || serializedUserData.email?.split("@")[0] || "User";

    return (
      <>
        <DashboardHeader
          title="Dashboard"
          description={`Welcome back, ${userName}! Here's an overview of your account.`}
          breadcrumbs={[{ label: "Home", href: "/" }, { label: "Dashboard" }]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DashboardCard
            title="Account Summary"
            description="Your account information and status"
            icon={<UserIcon className="h-5 w-5" />}>
            <UserAccountPreview serializedUserData={serializedUserData} isLoading={!serializedUserData} />
          </DashboardCard>

          <DashboardCard
            title="Recent Activity"
            description="Your latest account activities"
            icon={<Clock className="h-5 w-5" />}>
            <UserActivityPreview
              activities={logs}
              limit={5}
              showFilters={false}
              showHeader={false}
              showViewAll={true}
              viewAllUrl="/user/activity"
            />
          </DashboardCard>
        </div>
      </>
    );
  } catch (error) {
    console.error("Error in UserDashboardOverviewPage:", error);
    redirect("/login");
  }
}
