// src/app/dashboard/admin/profile/edit/page.tsx
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/require-session";
import { userService } from "@/lib/services/user-service";
import { EditProfileForm } from "@/components/profile/edit-profile-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function EditAdminProfilePage() {
  // The role check is now handled by the layout.tsx file.
  const session = await requireSession();

  const user = await userService.getUserById(session.user.id);
  if (!user) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/admin/profile">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>

        <h1 className="text-3xl font-bold">Edit Admin Profile</h1>
      </div>

      {/* Redirect back to the admin profile after saving */}
      <EditProfileForm user={user} backPath="/dashboard/admin/profile" />
    </div>
  );
}
