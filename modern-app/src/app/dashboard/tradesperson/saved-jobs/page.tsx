// src/app/dashboard/tradesperson/saved-jobs/page.tsx
import { requireSession } from "@/lib/auth/require-session";
import { redirect } from "next/navigation";
import { canAccess, SERVICE_ROLES } from "@/lib/auth/roles";
import { jobService } from "@/lib/services/job-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Eye, Bookmark, Crown } from "lucide-react";
import Link from "next/link";
import { getUrgencyColor, getUrgencyLabel, getStatusColor, getStatusLabel } from "@/lib/types/job";
import { SaveJobButton } from "@/components/jobs/save-job-button";
import { getSavedJobIdsForUser } from "@/lib/services/saved-jobs-service";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Pagination } from "@/components/ui/pagination";

type SavedJobsSearchParams = {
  page?: string;
};

type SavedJobsPageProps = {
  // ✅ Promise-only to match Next PageProps constraint
  searchParams?: Promise<SavedJobsSearchParams>;
};

export default async function SavedJobsPage({ searchParams }: SavedJobsPageProps) {
  const session = await requireSession();

  // ✅ resolve search params safely
  const resolvedSearchParams = (await searchParams) ?? {};

  // Safe role validation
  if (!canAccess(session.user.role, SERVICE_ROLES)) {
    redirect("/dashboard");
  }

  const tier = (session.user.subscriptionTier ?? "basic") as "basic" | "pro" | "business";
  const isEligible = tier === "pro" || tier === "business";

  // 🔒 Soft-guard: Basic users see an upsell (no DB calls).
  if (!isEligible) {
    return (
      <div className="space-y-8">
        <DashboardHeader title="Saved Jobs" description="Jobs you’ve bookmarked to review later." />

        <Card className="border-amber-300/50 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
              <Crown className="h-5 w-5" />
              Upgrade to save jobs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-amber-900/80 dark:text-amber-200/90">
            <p className="text-sm">
              Saving jobs is a <span className="font-semibold">Pro</span> and{" "}
              <span className="font-semibold">Business</span> feature.
            </p>
            <ul className="ml-5 list-disc space-y-1 text-sm">
              <li>Bookmark promising jobs to revisit later</li>
              <li>Build a pipeline before you quote</li>
              <li>Combine with filters like “No quotes yet”</li>
            </ul>
            <div className="flex gap-2 pt-2">
              <Button asChild>
                <Link href="/pricing">See plans</Link>
              </Button>
              <Button variant="secondary" asChild>
                <Link href="/dashboard/tradesperson/job-board">Back to Job Board</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tradespersonId = session.user.id;
  const savedJobIds = await getSavedJobIdsForUser(tradespersonId);

  const jobs = (await Promise.all(savedJobIds.map(id => jobService.getJobById(id)))).filter(
    (j): j is NonNullable<typeof j> => Boolean(j)
  );

  const itemsPerPage = 6;
  const totalPages = Math.max(1, Math.ceil(jobs.length / itemsPerPage));

  const rawPage = Number(resolvedSearchParams.page ?? "1");
  const currentPage = Number.isFinite(rawPage) && rawPage > 0 ? Math.min(Math.floor(rawPage), totalPages) : 1;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedJobs = jobs.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-8">
      <DashboardHeader
        title="Saved Jobs"
        description="Jobs you have saved to review later."
        actions={
          <Button variant="secondary" asChild>
            <Link href="/dashboard/tradesperson/job-board">Browse Jobs</Link>
          </Button>
        }
      />

      {jobs.length === 0 ? (
        <Card className="border border-border/60 bg-secondary text-secondary-foreground dark:bg-secondary dark:text-secondary-foreground">
          <CardContent className="p-12 text-center text-muted-foreground">
            <div className="flex flex-col items-center gap-2">
              <Bookmark className="h-10 w-10" />
              <p>You haven’t saved any jobs yet.</p>
              <Button className="mt-2" asChild>
                <Link href="/dashboard/tradesperson/job-board">Find jobs to save</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            {paginatedJobs.map(job => (
              <Card
                key={job.id}
                className="flex flex-col border border-border/60 bg-secondary text-secondary-foreground shadow-sm transition-shadow hover:border-primary/40 hover:shadow-md dark:bg-secondary dark:text-secondary-foreground">
                <CardHeader className="space-y-2 pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg capitalize">{job.title}</CardTitle>

                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {job.description?.length > 120 ? `${job.description.slice(0, 120)}…` : job.description}
                      </p>

                      {job.location?.postcode && (
                        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>{job.location.postcode}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <Badge className={getUrgencyColor(job.urgency)}>{getUrgencyLabel(job.urgency)}</Badge>
                      <Badge className={getStatusColor(job.status)}>{getStatusLabel(job.status)}</Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="mt-auto flex flex-wrap items-center justify-end gap-2 border-t pt-4">
                  <SaveJobButton jobId={job.id} size="sm" allowRemove variant="ghost" />
                  <Link href={`/dashboard/tradesperson/job-board/${job.id}`}>
                    <Button variant="secondary" size="sm">
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          {jobs.length > itemsPerPage && <Pagination currentPage={currentPage} totalPages={totalPages} />}
        </>
      )}
    </div>
  );
}
