// src/app/dashboard/customer/profile/edit/page.tsx
import { requireSession } from "@/lib/auth/require-session";
import { userService } from "@/lib/services/user-service";
import { EditProfileForm } from "@/components/profile/edit-profile-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

import { Lightbulb, CheckCircle, Clock, Phone } from "lucide-react";

export default async function EditCustomerProfilePage() {
  // The layout guard handles the primary auth and role checks.
  // We use requireSession() to get the fresh session data.
  const session = await requireSession();

  const user = await userService.getUserById(session.user.id);

  if (!user) {
    return (
      <Card className="m-auto mt-8 max-w-lg">
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>Could not load your user data. Please try again later.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    // A responsive grid layout for larger screens
    <div className="grid lg:grid-cols-3 gap-8">
      {/* --- Main Content Column --- */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center gap-4">
          {/* <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/customer/profile">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button> */}
          <div>
            <h1 className="text-3xl font-bold">Edit Your Profile</h1>
            <p className="text-muted-foreground">Keep your contact and address information up to date.</p>
          </div>
        </div>
        <EditProfileForm user={user} backPath="/dashboard/customer/profile" />
      </div>

      {/* --- Sidebar Column for Tips --- */}
      <div className="lg:col-span-1">
        <Card className="sticky top-24">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              Why Update?
            </CardTitle>
            <CardDescription>Keeping your profile current helps ensure a smooth experience.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <Phone className="h-4 w-4 mt-1 text-primary" />
                <span>
                  <strong>Accurate Contact Info:</strong> An up-to-date phone number allows tradespeople to contact you
                  with any urgent questions about your job.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="h-4 w-4 mt-1 text-primary" />
                <span>
                  <strong>Faster Quotes:</strong> Tradespeople can provide quicker and more accurate quotes when they
                  have the correct location information for the job.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-4 w-4 mt-1 text-primary" />
                <span>
                  <strong>Seamless Service:</strong> Correct details help ensure that the tradesperson arrives at the
                  right place at the right time.
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
