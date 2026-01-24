import { requireSession } from "@/lib/auth/require-session";
import { redirect, notFound } from "next/navigation";
import { jobService } from "@/lib/services/job-service";
import { EditJobForm } from "@/components/jobs/edit-job-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft, Lightbulb, Pencil, MessageSquare } from "lucide-react";

interface EditJobPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditJobPage({ params }: EditJobPageProps) {
  // The layout guard handles the primary auth and role checks.
  // We use requireSession() to get the fresh session data for the ownership check.
  const session = await requireSession();

  const { id } = await params;
  const job = await jobService.getJobById(id);
  if (!job) {
    notFound();
  }

  // --- Ownership Security Check ---
  // This page must still verify that the user owns this job or is an admin.
  const isOwner = job.customerId === session.user.id;
  const isAdmin = session.user.role === "admin";

  if (!isOwner && !isAdmin) {
    redirect("/dashboard");
  }

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* --- Main Content Column --- */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/customer/jobs/${job.id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Job</h1>
            <p className="text-muted-foreground">Update the details for &ldquo;{job.title}&rdquo;</p>
          </div>
        </div>
        <EditJobForm job={job} />
      </div>

      {/* --- Sidebar Column for Tips --- */}
      <div className="lg:col-span-1">
        <Card className="sticky top-24">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              Editing Tips
            </CardTitle>
            <CardDescription>Improve your job post to get better quotes.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <Pencil className="h-4 w-4 mt-1 text-primary" />
                <span>
                  <strong>Be Specific:</strong> The more detail you add to your description, the more accurate the
                  quotes you will receive.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <MessageSquare className="h-4 w-4 mt-1 text-primary" />
                <span>
                  <strong>Check for Typos:</strong> Ensure your postcode and contact details are correct so tradespeople
                  can find you.
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
