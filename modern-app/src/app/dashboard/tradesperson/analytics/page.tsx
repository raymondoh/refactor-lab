import { redirect } from "next/navigation";
import { format } from "date-fns";
import { requireSession } from "@/lib/auth/require-session";
import { jobService } from "@/lib/services/job-service";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { Quote } from "@/lib/types/quote";

interface ChartDatum {
  label: string;
  value: number;
}

const chartColors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

// Small helper to coerce Firestore Timestamp | string | Date -> Date
type DateLike =
  | Date
  | string
  | number
  | { toDate: () => Date }
  | { seconds: number };

function toDate(value: DateLike | null | undefined): Date {
  if (value instanceof Date) return value;
  if (value && typeof value === "object") {
    if ("toDate" in value && typeof value.toDate === "function") return value.toDate();
    if ("seconds" in value && typeof value.seconds === "number") return new Date(value.seconds * 1000);
  }
  if (typeof value === "number") return new Date(value);
  if (typeof value === "string") return new Date(value);
  return new Date();
}

export default async function AnalyticsPage() {
  // The layout guard ensures only tradespeople or admins can access this route.
  // We get the fresh session data to perform the tier check.
  const session = await requireSession();

  // This page requires a specific subscription tier, which is a more specific
  // check than the role-based guard in the layout.
  const effectiveTier = session.user.subscriptionTier ?? "basic";

  // Only Business tier can view analytics. Admins bypass this.
  if (session.user.role !== "admin" && effectiveTier !== "business") {
    redirect("/dashboard/tradesperson");
  }

  const tradespersonId = session.user.id;
  type QuoteWithAcceptedDate = Quote & { acceptedDate?: Date };
  const quotes = (await jobService.getQuotesByTradespersonId(tradespersonId)) as QuoteWithAcceptedDate[];

  const totalSubmitted = quotes.length;
  const acceptedQuotes: QuoteWithAcceptedDate[] = quotes.filter(q => q.status === "accepted");
  const totalAccepted = acceptedQuotes.length;
  const acceptanceRate = totalSubmitted ? (totalAccepted / totalSubmitted) * 100 : 0;
  const averageQuoteValue = totalSubmitted ? quotes.reduce((sum, q) => sum + (q.price || 0), 0) / totalSubmitted : 0;

  // Submissions & acceptance by month
  const submissionsByMonth: Record<string, { total: number; accepted: number }> = {};
  quotes.forEach(q => {
    const key = format(toDate(q.createdAt), "yyyy-MM");
    submissionsByMonth[key] ??= { total: 0, accepted: 0 };
    submissionsByMonth[key].total++;
    if (q.status === "accepted") submissionsByMonth[key].accepted++;
  });
  const acceptanceData: ChartDatum[] = Object.entries(submissionsByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, { total, accepted }]) => ({
      label: month,
      value: total ? (accepted / total) * 100 : 0
    }));

  // Won jobs by service type
  const acceptedJobs = await Promise.all(acceptedQuotes.map(q => jobService.getJobById(q.jobId)));
  const serviceCounts: Record<string, number> = {};
  acceptedJobs.forEach(job => {
    const type = job?.serviceType || "Other";
    serviceCounts[type] = (serviceCounts[type] || 0) + 1;
  });
  const serviceData: ChartDatum[] = Object.entries(serviceCounts).map(([label, value]) => ({ label, value }));

  // Earnings by month (use acceptedDate -> updatedAt -> createdAt)
  const earningsByMonth: Record<string, number> = {};
  acceptedQuotes.forEach(q => {
    const date = q.acceptedDate ?? q.updatedAt ?? q.createdAt;
    const key = format(toDate(date), "yyyy-MM");
    earningsByMonth[key] = (earningsByMonth[key] || 0) + (q.price || 0);
  });
  const earningsData: ChartDatum[] = Object.entries(earningsByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, value]) => ({ label, value }));
  const maxEarnings = earningsData.reduce((m, d) => Math.max(m, d.value), 0);

  return (
    <div className="space-y-8">
      <DashboardHeader
        title="Analytics"
        description="Insights into your quoting performance."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Quote Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">
              {totalAccepted} of {totalSubmitted} quotes accepted
            </p>
            <div className="h-2 bg-muted rounded">
              <div className="h-2 bg-primary rounded" style={{ width: `${acceptanceRate}%` }} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acceptance Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{acceptanceRate.toFixed(1)}%</div>
            <div className="mt-4 h-24 w-full">
              <LineChart data={acceptanceData} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Average Quote Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{averageQuoteValue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Jobs Won by Service Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <PieChart data={serviceData} />
            </div>
            <ul className="mt-4 space-y-1 text-sm">
              {serviceData.map((d, i) => (
                <li key={d.label} className="flex items-center gap-2">
                  <span
                    className="inline-block h-3 w-3 rounded-sm"
                    style={{ backgroundColor: chartColors[i % chartColors.length] }}
                  />
                  {d.label} ({d.value})
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Earnings Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-40">
              {earningsData.map(d => (
                <div key={d.label} className="flex flex-col items-center flex-1">
                  <div
                    className="w-full bg-primary rounded-t"
                    style={{ height: `${maxEarnings ? (d.value / maxEarnings) * 100 : 0}%` }}
                  />
                  <span className="mt-1 text-xs">{format(new Date(d.label + "-01"), "MMM")}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LineChart({ data }: { data: ChartDatum[] }) {
  if (data.length === 0) return null;
  const points = data
    .map((d, i) => {
      const x = (i / (data.length - 1 || 1)) * 100;
      const y = 100 - d.value;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full text-primary">
      <polyline fill="none" stroke="currentColor" strokeWidth={1} points={points} />
      {data.map((d, i) => {
        const x = (i / (data.length - 1 || 1)) * 100;
        const y = 100 - d.value;
        return <circle key={d.label} cx={x} cy={y} r={2} fill="currentColor" />;
      })}
    </svg>
  );
}

function PieChart({ data }: { data: ChartDatum[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) {
    return <div className="h-32 w-32 rounded-full bg-muted" />;
  }
  let current = 0;
  const segments = data.map((d, i) => {
    const start = (current / total) * 360;
    current += d.value;
    const end = (current / total) * 360;
    return `${chartColors[i % chartColors.length]} ${start}deg ${end}deg`;
  });
  return <div className="h-32 w-32 rounded-full" style={{ background: `conic-gradient(${segments.join(",")})` }} />;
}
