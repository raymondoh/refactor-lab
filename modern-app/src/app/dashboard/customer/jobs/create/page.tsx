import { requireSession } from "@/lib/auth/require-session";
import { userService } from "@/lib/services/user-service";
import { CreateJobForm } from "@/components/jobs/create-job-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, Pencil, MessageSquare } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CreateJobPage() {
  // The layout guard handles auth and role checks.
  // We use requireSession() here to securely get the user's ID to pass to the form.
  const session = await requireSession();

  const user = await userService.getUserById(session.user.id);

  if (!user) {
    // A more robust error message can be handled here
    return <div>Error: Could not load your user data. Please try again later.</div>;
  }

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* --- Main Content Column --- */}
      <div className="lg:col-span-2 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Post a New Job</h1>
          <p className="text-muted-foreground">Fill out the details below to get quotes from local professionals.</p>
        </div>
        <CreateJobForm user={user} />
      </div>

      {/* --- Sidebar Column for Tips --- */}
      <div className="lg:col-span-1">
        <Card className="sticky top-24">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              Posting Tips
            </CardTitle>
            <CardDescription>Improve your job post to attract the best tradespeople.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <Pencil className="h-4 w-4 mt-1 text-primary" />
                <span>
                  <strong>Be Specific & Detailed:</strong> The more information you include, the more accurate your
                  quotes will be. Mention the problem, materials, and desired outcome.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <MessageSquare className="h-4 w-4 mt-1 text-primary" />
                <span>
                  <strong>Add Photos:</strong> A picture is worth a thousand words. Upload photos of the job to help
                  professionals understand the work required before they even quote.
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
