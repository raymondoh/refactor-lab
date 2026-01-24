// src/app/dashboard/business-owner/saved-jobs/page.tsx
import { requireSession } from "@/lib/auth/require-session";
import { getSavedJobIdsForUser } from "@/lib/services/saved-jobs-service";
import { jobService } from "@/lib/services/job-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Bookmark, Eye, MapPin } from "lucide-react";
import { getUrgencyColor, getUrgencyLabel, getStatusColor, getStatusLabel } from "@/lib/types/job";
import { SaveJobButton } from "@/components/jobs/save-job-button";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";

export default async function BusinessOwnerSavedJobsPage() {
  const session = await requireSession();

  const tier = (session.user.subscriptionTier ?? "business") as "basic" | "pro" | "business";
  const isEligible = tier === "pro" || tier === "business";

  if (!isEligible) {
    return (
      <div className="space-y-8">
        <DashboardHeader title="Saved Jobs" description="Bookmark promising jobs so your team can follow up later." />

        <Card className="border-amber-300/50 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="text-amber-900 dark:text-amber-200">Upgrade to unlock saved jobs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-amber-900/80 dark:text-amber-200/90">
            <p className="text-sm">
              Saving jobs is available on the <span className="font-semibold">Pro</span> and{" "}
              <span className="font-semibold">Business</span> plans.
            </p>
            <ul className="list-disc ml-5 text-sm space-y-1">
              <li>Keep track of jobs that are a good fit for your company</li>
              <li>Coordinate follow ups with your office staff</li>
              <li>Assign opportunities to the right team member</li>
            </ul>
            <div className="flex gap-2 pt-2">
              <Button asChild>
                <Link href="/pricing">See plans</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/dashboard/business-owner/job-board">Back to Job Board</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const userId = session.user.id;
  const savedJobIds = await getSavedJobIdsForUser(userId);
  const jobs = (await Promise.all(savedJobIds.map(id => jobService.getJobById(id)))).filter(
    (job): job is NonNullable<typeof job> => Boolean(job)
  );

  return (
    <div className="space-y-8">
      <DashboardHeader
        title="Saved Jobs"
        description="Jobs you’ve flagged for your business to review later."
        actions={
          <Button variant="ghost" asChild>
            <Link href="/dashboard/business-owner/job-board">Browse Jobs</Link>
          </Button>
        }
      />

      {jobs.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <div className="flex flex-col items-center gap-2">
              <Bookmark className="h-10 w-10" />
              <p>You haven’t saved any jobs yet.</p>
              <Button className="mt-2" asChild>
                <Link href="/dashboard/business-owner/job-board">Find jobs to save</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {jobs.map(job => (
            <Card key={job.id} className="flex flex-col">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-lg">{job.title}</CardTitle>
                  <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Badge className={getUrgencyColor(job.urgency)}>{getUrgencyLabel(job.urgency)}</Badge>
                  <Badge className={getStatusColor(job.status)}>{getStatusLabel(job.status)}</Badge>
                </div>
              </CardHeader>
              <CardContent className="mt-auto flex items-center justify-between border-t pt-4">
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-1.5" />
                  <span>{job.location.postcode}</span>
                </div>
                <div className="flex gap-2">
                  <SaveJobButton jobId={job.id} size="sm" allowRemove />
                  <Link href={`/dashboard/business-owner/job-board/${job.id}`}>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
