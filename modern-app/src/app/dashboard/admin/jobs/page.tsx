// src/app/dashboard/admin/jobs/page.tsx

import { requireSession } from "@/lib/auth/require-session";
import { JobsPageComponent } from "@/components/dashboard/jobs-page-component";

export default async function AdminJobsPage() {
  const session = await requireSession();

  return (
    <JobsPageComponent
      session={session}
      pageTitle="Manage Jobs"
      pageDescription="View, search, and oversee every job posted across the platform."
      allowedRoles={["admin"]}
      apiEndpoint="/api/jobs/search"
      listPath="/dashboard/admin/jobs"
      jobDetailPathPattern="/dashboard/admin/jobs/{id}"
      viewMode="table"
      showSaveButton={false}
    />
  );
}
