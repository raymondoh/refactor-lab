// src/app/(dashboard)/user/page.tsx
import { redirect, unstable_rethrow } from "next/navigation";
import { parseServerDate } from "@/utils/date-server";
import type { User, SerializedUser } from "@/types/models/user";
import { serializeUser } from "@/utils/serializeUser";
import { fetchUserActivityLogs } from "@/actions/dashboard";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { UserAccountPreview } from "@/components/dashboard/user/overview/UserAccountPreview";
import { UserActivityPreview } from "@/components";
import { Clock, UserIcon } from "lucide-react";
import { userProfileService } from "@/lib/services/user-profile-service";
import { auth } from "@/auth";

type ServiceUser = Partial<User> & {
  passwordHash?: string;
  provider?: string;
  has2FA?: boolean;
};

export default async function UserDashboardOverviewPage() {
  try {
    const session = await auth();

    // Layout already guards, but keep this as a hard safety net.
    if (!session?.user) {
      redirect("/login");
    }

    const userId = session.user.id;
    const sessionUser = session.user as User;

    const activityResult = await fetchUserActivityLogs(userId, 5);
    const logs = activityResult.success ? activityResult.logs : [];

    // Fallback base from session
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

    const profileResult = await userProfileService.getProfileByUserId(userId);

    // If profile fetch failed, don’t redirect to login (that causes loops).
    // Better: show not-authorized or a generic error page.
    if (!profileResult.ok) {
      redirect("/not-authorized");
    }

    const serviceUser = profileResult.data.user as ServiceUser;

    userData = {
      ...userData,
      ...serviceUser,
      createdAt: parseServerDate(serviceUser.createdAt) ?? userData.createdAt,
      lastLoginAt: parseServerDate(serviceUser.lastLoginAt) ?? userData.lastLoginAt,
      updatedAt: parseServerDate(serviceUser.updatedAt) ?? userData.updatedAt,
      hasPassword: !!serviceUser.passwordHash || serviceUser.provider !== "google",
      has2FA: serviceUser.has2FA ?? false
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
  } catch (error: unknown) {
    // ✅ rethrow redirect()/notFound() control-flow errors
    unstable_rethrow(error);

    console.error("Error in UserDashboardOverviewPage:", error);
    redirect("/not-authorized");
  }
}
