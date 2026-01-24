// // src/app/dashboard/admin/profile/page.tsx
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/require-session";
import { userService } from "@/lib/services/user-service";
import ProfilePage from "@/components/profile/profile-page";

export default async function AdminProfilePage() {
  // The role check is now handled by the layout.tsx file.
  // We can use requireSession to get the fresh session data.
  const session = await requireSession();

  const user = await userService.getUserById(session.user.id);
  if (!user) {
    notFound();
  }

  return <ProfilePage user={user} sessionImage={session.user.image ?? null} />;
}
