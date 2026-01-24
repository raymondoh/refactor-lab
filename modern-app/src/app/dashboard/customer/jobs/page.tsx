// src/app/dashboard/customer/jobs/page.tsx

import Link from "next/link";
import { Plus } from "lucide-react";

import { requireSession } from "@/lib/auth/require-session";
import { JobsPageComponent } from "@/components/dashboard/jobs-page-component";
import { Button } from "@/components/ui/button";

export default async function CustomerJobsPage() {
  const session = await requireSession();

  return (
    <JobsPageComponent
      session={session}
      pageTitle="My Posted Jobs"
      pageDescription="Track progress, manage quotes, make payments and stay informed about your job activity."
      allowedRoles={["customer", "admin"]}
      apiEndpoint="/api/jobs/my-jobs"
      listPath="/dashboard/customer/jobs"
      jobDetailPathPattern="/dashboard/customer/jobs/{id}"
      viewMode="table"
      showSaveButton={false}
      showSearch={false}
      showFilters={false}
      headerActions={
        <Button asChild>
          <Link href="/dashboard/customer/jobs/create">
            <Plus className="mr-2 h-4 w-4" /> Post a New Job
          </Link>
        </Button>
      }
    />
  );
}
