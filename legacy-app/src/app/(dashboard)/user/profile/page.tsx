import { redirect } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { DashboardShell, DashboardHeader } from "@/components";
import { UserProfileForm } from "@/components/auth/UserProfileForm";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { userProfileService } from "@/lib/services/user-profile-service";
import { auth } from "@/auth";
export default async function UserProfilePage() {
  try {
    // Dynamic import for auth to avoid build-time issues

    const session = await auth();

    // Check authentication
    if (!session?.user) {
      redirect("/login");
    }

    // Get current user using UserService
    const userResult = await userProfileService.getProfileByUserId(session.user.id);

    // Handle error case
    if (!userResult.success) {
      console.error("Error getting current user:", userResult.error);
      return (
        <DashboardShell>
          <DashboardHeader
            title="Profile"
            description="Update your account settings"
            breadcrumbs={[{ label: "Home", href: "/" }, { label: "Profile" }]}
          />
          <Separator className="mb-8" />
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Error loading profile: {userResult.error}</AlertDescription>
          </Alert>
        </DashboardShell>
      );
    }

    // Line 52 Change:
    const user = userResult.data.user; // Access .user

    return (
      <DashboardShell>
        <DashboardHeader
          title="Profile"
          description="Update your account settings"
          breadcrumbs={[{ label: "Home", href: "/" }, { label: "Profile" }]}
        />
        <Separator className="mb-8" />

        <div className="w-full max-w-7xl overflow-hidden">
          <div className="profile-form-container">
            <UserProfileForm user={user} isLoading={false} isAdmin={false} />
          </div>
        </div>
      </DashboardShell>
    );
  } catch (error) {
    console.error("Error in UserProfilePage:", error);
    redirect("/login");
  }
}
