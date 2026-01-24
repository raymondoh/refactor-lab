import { requireSession } from "@/lib/auth/require-session";
import { notFound, redirect } from "next/navigation";
import { canAccess, SERVICE_ROLES } from "@/lib/auth/roles";
import { userService } from "@/lib/services/user-service";
import ProfilePage from "@/components/profile/profile-page";

export default async function TradespersonProfilePage() {
  // The layout guard handles role protection (tradesperson or admin).
  // We use requireSession() to securely get the user's ID.
  const session = await requireSession();

  // safe role check
  if (!canAccess(session.user.role, SERVICE_ROLES)) {
    redirect("/dashboard");
  }

  // Fetch the full user object including certifications
  const user = await userService.getUserById(session.user.id);
  if (!user) {
    // Using notFound() is more appropriate here than returning a div
    notFound();
  }

  return <ProfilePage user={user} sessionImage={session.user.image} />;
}
