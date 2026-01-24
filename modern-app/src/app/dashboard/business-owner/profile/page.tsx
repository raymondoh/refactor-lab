import { notFound } from "next/navigation";
import { userService } from "@/lib/services/user-service";
import ProfilePage from "@/components/profile/profile-page";
import { requireSession } from "@/lib/auth/require-session";

export default async function BusinessProfilePage() {
  // The layout guard handles role protection (tradesperson. business owner or admin).
  // We use requireSession() to securely get the user's ID.
  const session = await requireSession();

  // Fetch the full user object including certifications
  const user = await userService.getUserById(session.user.id);
  if (!user) {
    // Using notFound() is more appropriate here than returning a div
    notFound();
  }

  return <ProfilePage user={user} sessionImage={session.user.image} />;
}
