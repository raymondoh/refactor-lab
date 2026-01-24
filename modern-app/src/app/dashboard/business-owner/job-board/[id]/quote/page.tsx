// src/app/dashboard/business-owner/job-board/[id]/quote/page.tsx
import { requireSession } from "@/lib/auth/require-session";
import { redirect, notFound } from "next/navigation";
import { jobService } from "@/lib/services/job-service";
import { userService } from "@/lib/services/user-service";
import { SubmitQuoteForm } from "@/components/jobs/submit-quote-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, DollarSign, FileText } from "lucide-react";
import Link from "next/link";
import { JobSummaryCard } from "@/components/jobs/job-summary-card";

interface QuotePageProps {
  params: Promise<{ id: string }>;
}

export default async function BusinessOwnerQuotePage({ params }: QuotePageProps) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  const session = await requireSession();
  if (!["business_owner", "admin"].includes(session.user.role ?? "")) {
    redirect("/dashboard");
  }

  const job = await jobService.getJobById(id);
  if (!job) {
    notFound();
  }

  if (job.status !== "open") {
    redirect(`/dashboard/business-owner/job-board/${id}?error=closed`);
  }

  const { canSubmit } = await userService.canUserSubmitQuote(session.user.id);
  if (!canSubmit) {
    redirect("/pricing?reason=quote_limit");
  }

  const tier = session.user.subscriptionTier ?? "business";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/business-owner/job-board/${id}`} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Job
          </Link>
        </Button>
      </div>

      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground">Submit Your Quote</h1>
        <p className="text-muted-foreground mt-2">Review the job details below and provide your professional quote.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-6">
          <JobSummaryCard job={job} tier={tier} />
          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="bg-muted/50">
              <CardTitle className="flex items-center gap-2 text-card-foreground">
                <DollarSign className="h-5 w-5 text-secondary" />
                Your Quote Details
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Provide your professional quote and any additional information for the customer.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <SubmitQuoteForm jobId={id} />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 lg:sticky lg:top-24">
          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="bg-muted/50">
              <CardTitle className="flex items-center gap-2 text-card-foreground">
                <FileText className="h-5 w-5 text-primary" />
                Quote Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                <h4 className="font-semibold text-card-foreground">Best Practices</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <span>Be specific about what's included in your quote</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <span>Mention your qualifications and experience</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <span>Provide realistic timeframes for completion</span>
                  </li>
                </ul>
              </div>
              <div className="space-y-3 mt-4">
                <h4 className="font-semibold text-card-foreground">What Customers Look For</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-secondary rounded-full mt-2 flex-shrink-0"></div>
                    <span>Competitive and fair pricing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-secondary rounded-full mt-2 flex-shrink-0"></div>
                    <span>Clear communication and professionalism</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
