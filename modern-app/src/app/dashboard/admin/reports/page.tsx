// src/app/dashboard/admin/reports/page.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import { ResolveReportButton } from "@/components/admin/resolve-report-button";
import { formatDateShortGB, formatRelativeOrDate } from "@/lib/utils/format-date";
import type { Timestamp } from "firebase-admin/firestore";

export const dynamic = "force-dynamic"; // Ensure we fetch fresh data

type ReportStatus = "open" | "resolved" | string;

interface ReportData {
  id: string;
  jobId: string; // parent chat doc ID
  reportedBy: string;
  reason: string;
  createdAt: Date;
  status: ReportStatus;
  resolvedAt?: Date;
}

// Shape of the Firestore document in the "reports" collection group
interface FirestoreReportDoc {
  reportedBy?: string | null;
  reason?: string | null;
  createdAt?: Timestamp;
  status?: ReportStatus;
  resolvedAt?: Timestamp;
}

async function getRecentReports(): Promise<ReportData[]> {
  const db = getFirebaseAdminDb();

  console.log("[ReportsPage] Fetching reports from Firestore (no orderBy)...");

  try {
    const snapshot = await db.collectionGroup("reports").get();

    console.log("[ReportsPage] snapshot.size:", snapshot.size);

    const reports: ReportData[] = snapshot.docs.map(doc => {
      const data = doc.data() as FirestoreReportDoc;
      const jobId = doc.ref.parent.parent?.id || "unknown";

      const createdAt =
        data.createdAt && typeof data.createdAt.toDate === "function" ? data.createdAt.toDate() : new Date(0);

      const resolvedAt =
        data.resolvedAt && typeof data.resolvedAt.toDate === "function" ? data.resolvedAt.toDate() : undefined;

      return {
        id: doc.id,
        jobId,
        reportedBy: data.reportedBy || "unknown",
        reason: data.reason || "No reason provided",
        createdAt,
        status: data.status || "open",
        resolvedAt
      };
    });

    // Newest first
    reports.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Only show latest 20
    return reports.slice(0, 20);
  } catch (err: unknown) {
    const { code, message } =
      typeof err === "object" && err !== null
        ? {
            // Using `as` on a narrowed unknown is fine and avoids `any`
            code: (err as { code?: unknown }).code,
            message: (err as { message?: unknown }).message
          }
        : { code: undefined, message: String(err) };

    console.error("🔥 [ReportsPage] getRecentReports error:", {
      code,
      message
    });

    return [];
  }
}

export default async function ReportsPage() {
  const reports = await getRecentReports();

  return (
    <div className="space-y-8 p-4">
      <DashboardHeader title="Trust & Safety" description="Manage reports and data exports." />

      {/* --- Action Buttons --- */}
      <div className="flex gap-4">
        <Button variant="secondary" asChild>
          <Link href="/dashboard/admin/reports/users">Export Users CSV</Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href="/dashboard/admin/reports/jobs">Export Jobs CSV</Link>
        </Button>
      </div>

      {/* --- Reports Table --- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🚩 Recent Flags & Reports
            <Badge variant="secondary">{reports.length} Recent</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <p className="text-muted-foreground text-sm">No reports found. All good!</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Job ID</TableHead>
                  <TableHead>Reporter ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map(report => (
                  <TableRow key={report.id}>
                    {/* 1. Date */}
                    <TableCell className="whitespace-nowrap text-muted-foreground text-xs">
                      {formatRelativeOrDate(report.createdAt)}
                    </TableCell>

                    {/* 2. Reason */}
                    <TableCell className="font-medium max-w-xs">
                      <span className="line-clamp-2">{report.reason}</span>
                    </TableCell>

                    {/* 3. Job ID */}
                    <TableCell className="font-mono text-xs">{report.jobId}</TableCell>

                    {/* 4. Reporter ID */}
                    <TableCell className="font-mono text-xs text-muted-foreground">{report.reportedBy}</TableCell>

                    {/* 5. Status (badge + optional resolved date) */}
                    <TableCell>
                      {report.status === "resolved" && report.resolvedAt ? (
                        <div className="flex flex-col gap-0.5">
                          <Badge variant="outline" className="text-xs w-fit">
                            Resolved
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {formatDateShortGB(report.resolvedAt) ?? "Unknown"}
                          </span>
                        </div>
                      ) : (
                        <Badge variant="destructive" className="text-xs">
                          Open
                        </Badge>
                      )}
                    </TableCell>

                    {/* 6. Action */}
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" asChild>
                          <Link href={`/dashboard/messages/${report.jobId}`}>View Chat</Link>
                        </Button>
                        <ResolveReportButton jobId={report.jobId} reportId={report.id} status={report.status} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
