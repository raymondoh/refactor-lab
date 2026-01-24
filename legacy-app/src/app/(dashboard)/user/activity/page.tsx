import { redirect } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { DashboardShell, DashboardHeader } from "@/components";
import { UserActivityPageClient } from "@/components";
import { fetchUserActivityLogs } from "@/actions/dashboard";
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

export default async function UserActivityPage() {
  try {
    // Dynamic import for auth to avoid build-time issues
    const { auth } = await import("@/auth");
    const session = await auth();

    if (!session?.user) {
      redirect("/login");
    }

    // Fetch user activity logs
    const result = await fetchUserActivityLogs(session.user.id, 10);
    const initialLogs: Firebase.SerializedActivity[] = result.success
      ? result.logs.map(convertToSerializedActivity)
      : [];

    return (
      <DashboardShell>
        <DashboardHeader
          title="Activity Log"
          description="View your recent account activity"
          breadcrumbs={[{ label: "Home", href: "/" }, { label: "Activity Log" }]}
        />
        <Separator className="mb-8" />

        <div className="w-full max-w-full overflow-hidden">
          <UserActivityPageClient initialLogs={initialLogs} />
        </div>
      </DashboardShell>
    );
  } catch (error) {
    console.error("Error in UserActivityPage:", error);
    redirect("/login");
  }
}
