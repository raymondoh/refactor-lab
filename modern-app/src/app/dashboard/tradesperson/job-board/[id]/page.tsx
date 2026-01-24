// src/app/dashboard/tradesperson/job-board/[id]/page.tsx
import { requireSession } from "@/lib/auth/require-session";
import { redirect, notFound } from "next/navigation";
import { canAccess, SERVICE_ROLES } from "@/lib/auth/roles";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { jobService } from "@/lib/services/job-service";
import { userService } from "@/lib/services/user-service";
import Link from "next/link";
import { ArrowLeft, PoundSterling, Settings, Trash2, MessageCircle, CheckCircle, AlertTriangle } from "lucide-react";
import { SaveJobButton } from "@/components/jobs/save-job-button";
import { markJobComplete } from "@/actions/jobs/mark-complete";
import { JobSummaryCard } from "@/components/jobs/job-summary-card";

interface JobDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function JobDetailPage({ params, searchParams }: JobDetailPageProps) {
  const { id } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};

  const session = await requireSession();

  // Block access if role is missing or not allowed
  if (!canAccess(session.user.role, SERVICE_ROLES)) {
    redirect("/dashboard");
  }

  const job = await jobService.getJobById(id);
  if (!job) {
    notFound();
  }

  const existingQuotes = await jobService.getQuotesByJobId(job.id);
  const hasAlreadyQuoted = existingQuotes.some(q => q.tradespersonId === session.user.id);

  const isAssignedToUser = job.tradespersonId === session.user.id;
  const isAdmin = session.user.role === "admin";

  if (!isAdmin && job.status !== "open" && !isAssignedToUser) {
    redirect("/dashboard/tradesperson/job-board");
  }

  const tier = session.user.subscriptionTier ?? "basic";

  const { canSubmit: canSubmitQuote } = await userService.canUserSubmitQuote(session.user.id);

  const quoteSubmitted = resolvedSearchParams?.quote === "submitted";
  const quoteLimitFlag = resolvedSearchParams?.quote_limit === "1";

  const showQuoteLimitNotice =
    job.status === "open" && !hasAlreadyQuoted && tier === "basic" && (!canSubmitQuote || quoteLimitFlag);

  const jobActions = (
    <div className="w-full space-y-3">
      {job.status === "open" && (
        <>
          {hasAlreadyQuoted ? (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground p-3 bg-muted rounded-md">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>You have already submitted a quote for this job.</span>
            </div>
          ) : canSubmitQuote ? (
            <Button asChild className="w-full">
              <Link href={`/dashboard/tradesperson/job-board/${job.id}/quote`} className="flex items-center gap-2">
                <PoundSterling className="h-4 w-4" />
                Submit Quote
              </Link>
            </Button>
          ) : (
            <Button asChild className="w-full">
              <Link href="/pricing" className="flex items-center gap-2">
                <PoundSterling className="h-4 w-4" />
                Upgrade to Submit More Quotes
              </Link>
            </Button>
          )}
          {/* The prop is `tierOverride`, not `tier`. */}
          <SaveJobButton jobId={job.id} tierOverride={tier} showUpsell />
        </>
      )}
      {isAssignedToUser && (
        <>
          <Button asChild className="w-full" variant="secondary">
            <Link href={`/dashboard/messages/${job.id}`}>
              <MessageCircle className="mr-2 h-4 w-4" />
              Chat with Customer
            </Link>
          </Button>
          {job.status === "assigned" && (
            <form action={markJobComplete} className="w-full">
              <input type="hidden" name="jobId" value={job.id} />
              <Button type="submit" className="w-full">
                <CheckCircle className="h-4 w-4 mr-2" /> Mark as Complete
              </Button>
            </form>
          )}
        </>
      )}
      {isAdmin && (
        <>
          <Separator />
          <Button variant="secondary" className="w-full">
            <Settings className="h-4 w-4 mr-2" />
            Manage Job
          </Button>
          <Button variant="danger" className="w-full">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Job
          </Button>
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/tradesperson/job-board" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Job Board
            </Link>
          </Button>
        </div>
      </div>

      {showQuoteLimitNotice && (
        <Alert variant="destructive" className="border-destructive/20 bg-destructive/5">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Quote limit reached</AlertTitle>
          <AlertDescription>
            You&apos;ve used your 5 quotes this month on the Basic plan. Upgrade your plan to keep submitting quotes on
            new jobs.
          </AlertDescription>
        </Alert>
      )}

      {quoteSubmitted && (
        <Alert className="border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-300">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-semibold">Your quote has been submitted successfully!</p>
            <p className="text-sm">
              The customer will be notified and can review your quote. You&apos;ll be notified if they accept.
            </p>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-6">
          <JobSummaryCard job={job} tier={tier} actions={jobActions} />
        </div>

        <div className="space-y-6 lg:sticky lg:top-24">
          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="bg-muted/50">
              <CardTitle className="flex items-center gap-2 text-primary">
                <MessageCircle className="h-5 w-5" />
                Need Help?
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                Questions about this job? Contact our support team for assistance with quotes or job requirements.
              </p>
              <Button variant="secondary" size="sm" className="w-full">
                <MessageCircle className="h-4 w-4 mr-2" />
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
