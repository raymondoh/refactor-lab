import { redirect } from "next/navigation";
import { getAdminFirestore } from "@/lib/firebase/admin/initialize";
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
    name: log.description || log.type // Use description as name fallback
  };
}

export default async function UserDashboardOverviewPage() {
  try {
    // Dynamic import for auth to avoid build-time issues
    const { auth } = await import("@/auth");
    const session = await auth();

    if (!session?.user) {
      redirect("/login");
    }

    const userId = session.user.id;
    const sessionUser = session.user as User;

    // Fetch activity logs using the corrected function
    const result = await fetchUserActivityLogs(userId, 5);
    const logs: Firebase.SerializedActivity[] = result.success ? result.logs.map(convertToSerializedActivity) : [];

    // Start with session values and fallback structure
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

    try {
      // Use the new Firebase admin initialization
      const db = getAdminFirestore();
      const doc = await db.collection("users").doc(userId).get();

      if (doc.exists) {
        const firestoreData = doc.data() as Partial<User>;

        userData = {
          ...userData,
          ...firestoreData,
          createdAt: parseServerDate(firestoreData.createdAt) ?? new Date(),
          lastLoginAt: parseServerDate(firestoreData.lastLoginAt) ?? new Date(),
          updatedAt: parseServerDate(firestoreData.updatedAt) ?? new Date(),
          hasPassword: !!firestoreData.passwordHash || firestoreData.provider !== "google",
          has2FA: firestoreData.has2FA ?? false
        };
      }
    } catch (error) {
      console.error("Error fetching Firestore user:", error);
      // Continue with fallback session data
    }

    const serializedUserData: SerializedUser = serializeUser(userData);
    const userName = serializedUserData.name || serializedUserData.email?.split("@")[0] || "User";

    return (
      <>
        <DashboardHeader
          title="Dashboard"
          description={`Welcome back, ${userName}! Here's an overview of your account.`}
          breadcrumbs={[{ label: "Home", href: "/" }, { label: "Dashboard" }]}
        />

        {/* Updated layout with consistent width */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Account summary in a card */}
          <DashboardCard
            title="Account Summary"
            description="Your account information and status"
            icon={<UserIcon className="h-5 w-5" />}>
            <UserAccountPreview serializedUserData={serializedUserData} isLoading={!serializedUserData} />
          </DashboardCard>

          {/* Activity preview in a card */}
          <DashboardCard
            title="Recent Activity"
            description="Your latest account activities"
            icon={<Clock className="h-5 w-5" />}>
            <UserActivityPreview
              activities={logs}
              limit={5}
              showFilters={false}
              showHeader={false} // We're using the card header instead
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
