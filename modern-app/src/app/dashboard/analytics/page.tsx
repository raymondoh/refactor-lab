/// src/app/dashboard/analytics/page.tsx
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/require-session";
import { canAccess, ROLES } from "@/lib/auth/roles";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { analyticsService } from "@/lib/services/analytics-service";
import { MultiLineChart } from "@/components/analytics/charts";
import { MetricsTable } from "@/components/analytics/metrics-table";

const ANALYTICS_ROLES = [ROLES.ADMIN, ROLES.BUSINESS_OWNER] as const;

export default async function AnalyticsDashboardPage() {
  const session = await requireSession();

  if (!canAccess(session.user.role, ANALYTICS_ROLES)) {
    redirect("/dashboard");
  }

  const monthly = await analyticsService.getMonthlyMetrics({
    userScope:
      session.user.role === ROLES.BUSINESS_OWNER ? { role: session.user.role, userId: session.user.id } : undefined
  });

  const totals = monthly.reduce(
    (acc, m) => {
      acc.users += m.users;
      acc.jobs += m.jobs;
      return acc;
    },
    { users: 0, jobs: 0 }
  );

  return (
    <div className="space-y-6">
      <DashboardHeader title="Analytics" description="Track user and job trends across the platform." />
      <MetricsTable
        metrics={[
          { label: "Total Users", value: totals.users },
          { label: "Total Jobs", value: totals.jobs }
        ]}
      />
      <div className="h-64">
        <MultiLineChart data={monthly} keys={["users", "jobs"]} colors={["#3b82f6", "#10b981"]} />
      </div>
    </div>
  );
}
