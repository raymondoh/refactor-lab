// src/app/dashboard/customer/profile/page.tsx
import { requireSession } from "@/lib/auth/require-session";
import { userService } from "@/lib/services/user-service";
import EnhancedProfilePage from "@/components/profile/profile-page"; // Assuming ProfilePage is your enhanced component
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function CustomerProfilePage() {
  // The layout guard handles the primary auth and role checks.
  // We use requireSession() to get the fresh session data.
  const session = await requireSession();

  const user = await userService.getUserById(session.user.id);

  if (!user) {
    // Enhanced error state for UI consistency
    return (
      <Card className="m-auto mt-8 max-w-lg">
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>Could not load your user data. Please try logging out and back in.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Passing the user data to your already-enhanced ProfilePage component
  return <EnhancedProfilePage user={user} sessionImage={session.user.image} />;
}
