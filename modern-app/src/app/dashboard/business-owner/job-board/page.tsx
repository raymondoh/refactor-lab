// src/app/dashboard/business-owner/job-board/page.tsx
import { requireSession } from "@/lib/auth/require-session";
// Reuse the same component as the tradesperson job board
import { JobsPageComponent } from "@/components/dashboard/jobs-page-component";

export default async function BusinessOwnerJobsBoardPage() {
  // The layout guard already ensures the user is a business_owner
  const session = await requireSession();

  return (
    <>
      {/* You might add specific banners for business owners here if needed */}

      <JobsPageComponent
        session={session} // Pass the session data
        pageTitle="Job Board"
        pageDescription="Find and quote on available jobs in your area."
        // Update allowed roles if needed, though layout guard handles primary access
        allowedRoles={["business_owner", "admin"]}
        apiEndpoint="/api/jobs/search" // Use the same API endpoint
        showSaveButton
        listPath="/dashboard/business-owner/job-board"
        // --- THIS IS THE FIX ---
        // Pass a string template instead of a function
        jobDetailPathPattern="/dashboard/business-owner/job-board/{id}"
        // --- END OF FIX ---
      />
    </>
  );
}
