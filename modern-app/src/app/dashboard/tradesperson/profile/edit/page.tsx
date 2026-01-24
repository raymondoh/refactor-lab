import { requireSession } from "@/lib/auth/require-session";
import { notFound, redirect } from "next/navigation";
import { userService } from "@/lib/services/user-service";
import { EditTradespersonProfileForm } from "@/components/profile/edit-tradesperson-profile-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft, Lightbulb, User, CheckCircle, Map } from "lucide-react";
import { canAccess, SERVICE_ROLES } from "@/lib/auth/roles";

export default async function EditTradespersonProfilePage() {
  // The layout guard handles role protection.
  // We use requireSession() to securely get the user's ID.
  const session = await requireSession();

  // Only service providers (tradesperson + business_owner) should be here.
  // Admin will also be allowed automatically by canAccess.
  if (!canAccess(session.user.role, SERVICE_ROLES)) {
    redirect("/dashboard");
  }

  const user = await userService.getUserById(session.user.id);

  if (!user) {
    notFound();
  }

  return (
    // A responsive grid layout for larger screens
    <div className="grid lg:grid-cols-3 gap-8">
      {/* --- Main Content Column --- */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="subtle" size="icon" asChild>
            <Link href="/dashboard/tradesperson/profile">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Your Profile</h1>
            <p className="text-muted-foreground">
              Keep your professional information up to date to attract more customers.
            </p>
          </div>
        </div>
        <EditTradespersonProfileForm user={user} />
      </div>

      {/* --- Sidebar Column for Tips --- */}
      <div className="lg:col-span-1">
        <Card className="sticky top-24">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              Profile Tips
            </CardTitle>
            <CardDescription>A great profile helps you win more jobs. Here are some suggestions:</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <User className="h-4 w-4 mt-1 text-primary" />
                <span>
                  <strong>Use a clear photo:</strong> A professional headshot or a clean company logo builds trust with
                  potential customers.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-4 w-4 mt-1 text-primary" />
                <span>
                  <strong>Highlight your specialties:</strong> Select all the services you excel at. This helps you
                  appear in relevant searches.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Map className="h-4 w-4 mt-1 text-primary" />
                <span>
                  <strong>Define your service area:</strong> Clearly state the towns or postcodes you cover so customers
                  know if you're local.
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
