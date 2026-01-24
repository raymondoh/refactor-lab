// src/app/dashboard/customer/page.tsx
import { getOptionalFreshSession } from "@/lib/auth/require-session";
import { userService } from "@/lib/services/user-service";
import { jobService } from "@/lib/services/job-service";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Briefcase, FileText, CheckCircle, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getStatusColor, getStatusLabel } from "@/lib/types/job";
import { formatDateTimeGB } from "@/lib/utils";
import { ProfileCompletenessCard } from "@/components/dashboard/profile-completeness-card";

export default async function CustomerDashboardPage() {
  // The layout now handles role-based security. We fetch the session here for display purposes.
  // Using getOptionalFreshSession ensures we have the latest user data from the database.
  const session = await getOptionalFreshSession();

  // The layout's requireAnyRole guard prevents this page from rendering for unauthenticated users.
  if (!session?.user?.id) {
    return null;
  }

  const user = await userService.getUserById(session.user.id);
  const myJobs = await jobService.getJobsByCustomer(session.user.id);

  // --- Profile completeness (customer) ---
  const required = [
    { ok: Boolean(user?.firstName), label: "First name" },
    { ok: Boolean(user?.lastName), label: "Last name" },
    { ok: Boolean(user?.phone), label: "Phone number" },
    { ok: Boolean(user?.location?.town), label: "Town/City" },
    { ok: Boolean(user?.location?.postcode), label: "Postcode" }
  ];
  const optional = [{ ok: Boolean(user?.location?.address), label: "Address" }];

  const requiredComplete = required.filter(r => r.ok).length;
  const completeness = required.length > 0 ? Math.round((requiredComplete / required.length) * 100) : 100;
  const missingRequired = required.filter(r => !r.ok).map(r => r.label);
  const missingOptional = optional.filter(o => !o.ok).map(o => o.label);
  //const needsProfile = missingRequired.length > 0;

  // --- Job stats ---
  const openJobs = myJobs.filter(job => job.status === "open").length;
  const quotesReceived = myJobs.reduce((acc, job) => acc + (job.quoteCount || 0), 0);
  const completedJobs = myJobs.filter(job => job.status === "completed").length;
  const latestJob = myJobs[0];

  return (
    <div className="space-y-6">
      <DashboardHeader title="Customer Dashboard" description={`Welcome back, ${user?.name || "user"}!`} />

      {/* --- Profile Completeness Section --- */}
      <ProfileCompletenessCard
        completeness={completeness}
        missingFields={missingRequired}
        optionalFields={missingOptional}
        profileEditUrl="/dashboard/customer/profile/edit"
        title="Complete Your Profile"
        description="Add your contact and location details so tradespeople can provide accurate quotes."
      />

      {/* --- Quick Stats Section --- */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs Posted</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myJobs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open for Quotes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openJobs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quotes Received</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quotesReceived}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jobs Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedJobs}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* --- Main Action Cards --- */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Post a New Job
            </CardTitle>
            <CardDescription>Ready to get quotes from local professionals? Post your job details here.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard/customer/jobs/create">Get Started</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              Manage My Jobs
            </CardTitle>
            <CardDescription>
              View the status of all your posted jobs and review the quotes you've received.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard/customer/jobs">View My Jobs</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              Favorite Tradespeople
            </CardTitle>
            <CardDescription>Quickly access tradespeople you've saved.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard/customer/favorites">View Favorites</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* --- Recent Activity Section --- */}
      {latestJob && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your most recently posted job.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg">
              <div>
                <p className="font-semibold">{latestJob.title}</p>
                <p className="text-sm text-muted-foreground">Posted {formatDateTimeGB(latestJob.createdAt)}</p>
              </div>
              <div className="flex items-center gap-4 mt-4 sm:mt-0">
                <Badge className={getStatusColor(latestJob.status)}>{getStatusLabel(latestJob.status)}</Badge>
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/dashboard/customer/jobs/${latestJob.id}`}>View Details</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
