// src/app/dashboard/customer/jobs/[id]/review/page.tsx
import { requireSession } from "@/lib/auth/require-session";
import { notFound } from "next/navigation";
import { jobService } from "@/lib/services/job-service";
import ReviewForm from "@/components/reviews/review-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface ReviewPageProps {
  params: Promise<{ id: string }>;
}

type ReviewableJob = {
  id?: string;
  customerId?: string | null;
  tradespersonId?: string | null;
  review?: unknown;
  customerReview?: unknown;
  reviewId?: string | null;
};

export default async function ReviewPage({ params }: ReviewPageProps) {
  const { id } = await params;

  // Authenticated customer/admin (enforced by layout guard + requireSession)
  const session = await requireSession();

  const rawJob = await jobService.getJobById(id);
  const job = rawJob as ReviewableJob | null;

  // Critical ownership check
  if (!job || job.customerId !== session.user.id) {
    notFound();
  }

  const hasReview = Boolean(job.review) || Boolean(job.customerReview) || Boolean(job.reviewId);

  // If we somehow have no tradespersonId, treat as not found (safer than rendering a broken form)
  if (!hasReview && !job.tradespersonId) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/customer/jobs/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">{hasReview ? "Review already submitted" : "Leave a Review"}</h1>
      </div>

      {hasReview ? (
        <Card className="max-w-md">
          <CardHeader className="flex flex-row items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            <div>
              <CardTitle className="text-lg">Thank you for your feedback</CardTitle>
              <CardDescription>You&apos;ve already submitted a review for this job.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Your review helps other customers choose the right tradesperson and helps plumbers build their reputation
              on the platform.
            </p>
            <Button asChild>
              <Link href={`/dashboard/customer/jobs/${id}`}>Back to job details</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        // ✅ tradespersonId is now typed, and we guarded against it being missing
        <ReviewForm jobId={id} tradespersonId={job.tradespersonId!} />
      )}
    </div>
  );
}
