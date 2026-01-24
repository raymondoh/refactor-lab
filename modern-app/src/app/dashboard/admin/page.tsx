// src/app/dashboard/admin/page.tsx
import { requireRole } from "@/lib/auth/guards";
import { userService } from "@/lib/services/user-service";
import { jobService } from "@/lib/services/job-service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Users, Briefcase, CheckCircle, FileText, ArrowRight, Building2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getStatusColor, getStatusLabel } from "@/lib/types/job";
import { formatDateGB, getInitials } from "@/lib/utils";
import { MultiLineChart, PieChart } from "@/components/analytics/charts";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { PlatformFeesCard } from "@/components/admin/platform-fees-card";

type FirestoreTimestamp = { toDate: () => Date } | { seconds: number };
function toDate(value: Date | FirestoreTimestamp | number | string | null | undefined): Date {
  if (value instanceof Date) return value;
  if (value && typeof (value as { toDate?: () => Date }).toDate === "function")
    return (value as { toDate: () => Date }).toDate();
  if (typeof value === "number") return new Date(value);
  if (typeof value === "string") return new Date(value);
  if (value && typeof (value as { seconds?: number }).seconds === "number")
    return new Date((value as { seconds: number }).seconds * 1000);
  return new Date();
}

export default async function AdminDashboardPage() {
  const session = await requireRole("admin");

  const [allUsers, allJobs, allQuotes, totalUsers, openJobs, completedJobs] = await Promise.all([
    userService.getAllUsers(),
    jobService.getAllJobs(),
    jobService.getAllQuotes(),
    userService.getTotalUserCount(),
    jobService.getJobCountByStatus("open"),
    jobService.getJobCountByStatus("completed")
  ]);
  const totalJobs = allJobs.length;
  const businessOwnerCount = allUsers.filter(user => user.role === "business_owner").length;

  const newestUsers = [...allUsers]
    .sort((a, b) => toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime())
    .slice(0, 5);

  const latestJobs = [...allJobs]
    .sort((a, b) => toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime())
    .slice(0, 5);

  const userSignups: Record<string, { customers: number; tradespeople: number; businessOwners: number }> = {};
  allUsers.forEach(u => {
    const d = toDate(u.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    userSignups[key] ??= { customers: 0, tradespeople: 0, businessOwners: 0 };
    if (u.role === "tradesperson") {
      userSignups[key].tradespeople++;
    } else if (u.role === "business_owner") {
      userSignups[key].businessOwners++;
    } else if (u.role === "customer") {
      userSignups[key].customers++;
    }
  });
  const signupMonths = Object.keys(userSignups).sort();
  const userGrowthData = signupMonths.map(m => ({
    label: m,
    customers: userSignups[m].customers,
    tradespeople: userSignups[m].tradespeople,
    businessOwners: userSignups[m].businessOwners
  }));

  const jobsByMonth: Record<string, number> = {};
  allJobs.forEach(j => {
    const d = toDate(j.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    jobsByMonth[key] = (jobsByMonth[key] || 0) + 1;
  });

  const quotesByMonth: Record<string, number> = {};
  allQuotes.forEach(q => {
    const d = toDate(q.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    quotesByMonth[key] = (quotesByMonth[key] || 0) + 1;
  });

  const jqMonths = Array.from(new Set([...Object.keys(jobsByMonth), ...Object.keys(quotesByMonth)])).sort();
  const jobQuoteData = jqMonths.map(m => ({ label: m, jobs: jobsByMonth[m] || 0, quotes: quotesByMonth[m] || 0 }));

  const tierCounts: Record<string, number> = { basic: 0, pro: 0, business: 0 };
  allUsers.forEach(u => {
    const tier = u.subscriptionTier ?? "basic";
    tierCounts[tier] = (tierCounts[tier] || 0) + 1;
  });

  const subscriptionData = Object.entries(tierCounts).map(([label, value]) => ({
    name: label.charAt(0).toUpperCase() + label.slice(1),
    value
  }));

  return (
    <div className="space-y-6">
      <DashboardHeader title="Admin Dashboard" description={`Welcome, ${session.user.name || "Admin"}!`} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Business Owners</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{businessOwnerCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalJobs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Jobs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openJobs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Jobs</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedJobs}</div>
          </CardContent>
        </Card>
      </div>
      <div className="mt-4">
        <PlatformFeesCard />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-40">
              <MultiLineChart
                data={userGrowthData}
                keys={["customers", "tradespeople", "businessOwners"]}
                colors={["#3b82f6", "#f97316", "#8b5cf6"]}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Subscription Tiers</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <PieChart data={subscriptionData} />
          </CardContent>
        </Card>
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Jobs & Quotes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-40">
              <MultiLineChart data={jobQuoteData} keys={["jobs", "quotes"]} colors={["#10b981", "#ef4444"]} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Newest Users</CardTitle>
            <CardDescription>The most recent users who have signed up.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {newestUsers.map(user => (
              <div key={user.id} className="flex items-center gap-4">
                <Avatar>
                  <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-grow">
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <Badge variant={user.role === "tradesperson" ? "secondary" : "outline"}>{user.role}</Badge>
              </div>
            ))}
            <Button asChild variant="secondary" className="w-full mt-4">
              <Link href="/dashboard/admin/users">
                Manage All Users <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Latest Jobs</CardTitle>
            <CardDescription>The most recently posted jobs on the platform.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {latestJobs.map(job => (
              <div key={job.id} className="flex items-center gap-4">
                <div className="flex-grow">
                  <p className="font-medium">{job.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {job.location.postcode} - Posted on {formatDateGB(toDate(job.createdAt))}
                  </p>
                </div>
                <Badge className={getStatusColor(job.status)}>{getStatusLabel(job.status)}</Badge>
              </div>
            ))}
            <Button asChild variant="secondary" className="w-full mt-4">
              <Link href="/dashboard/admin/jobs">
                Manage All Jobs <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
