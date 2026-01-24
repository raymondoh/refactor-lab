// src/app/dashboard/tradesperson/job-board/page.tsx
import { requireSession } from "@/lib/auth/require-session";
import { redirect } from "next/navigation";
import { canAccess, SERVICE_ROLES } from "@/lib/auth/roles";
import { JobsPageComponent } from "@/components/dashboard/jobs-page-component"; // Correct import
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Sparkles } from "lucide-react";

export default async function TradespersonJobsBoardPage() {
  const session = await requireSession();

  if (!canAccess(session.user.role, SERVICE_ROLES)) {
    redirect("/dashboard");
  }

  const effectiveTier = session.user.subscriptionTier ?? "basic";

  return (
    <>
      {/* Upsell banner for basic tier */}
      {effectiveTier === "basic" && (
        <div className="mb-4">
          <Alert>
            <Sparkles className="h-4 w-4" />
            <AlertTitle className="font-semibold">Unlock more on Pro & Business</AlertTitle>
            <AlertDescription>
              Get advanced job filters, save jobs for later, and submit unlimited quotes.
              <Button asChild size="sm" className="ml-2 inline-flex">
                <Link href="/pricing">See plans</Link>
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      <JobsPageComponent
        session={session}
        pageTitle="Job Board"
        pageDescription="Find and quote on available jobs in your area."
        allowedRoles={SERVICE_ROLES}
        apiEndpoint="/api/jobs/search"
        showSaveButton
        listPath="/dashboard/tradesperson/job-board"
        // --- THIS IS THE FIX ---
        // Pass the string pattern instead of the function
        jobDetailPathPattern="/dashboard/tradesperson/job-board/{id}"
        // --- END OF FIX ---
      />
    </>
  );
}
