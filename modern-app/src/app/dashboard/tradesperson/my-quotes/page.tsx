import { requireSession } from "@/lib/auth/require-session";
import { redirect } from "next/navigation";
import { canAccess, SERVICE_ROLES } from "@/lib/auth/roles";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import { FileText, Plus, CheckCircle } from "lucide-react";
import { jobService } from "@/lib/services/job-service";
import { formatDateShortGB } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { PaymentStatus } from "@/lib/types/job";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Pagination } from "@/components/ui/pagination";

type QuotesSearchParams = {
  page?: string;
};

type QuotesPageProps = {
  // ✅ Promise-only to satisfy Next PageProps constraint in your build
  searchParams?: Promise<QuotesSearchParams>;
};

export default async function MyQuotesPage({ searchParams }: QuotesPageProps) {
  const session = await requireSession();

  // Safely validate role
  if (!canAccess(session.user.role, SERVICE_ROLES)) {
    redirect("/dashboard");
  }

  const resolvedSearchParams = (await searchParams) ?? {};

  const quotes = await jobService.getQuotesByTradespersonId(session.user.id);

  const quotesWithJobDetails = await Promise.all(
    quotes.map(async quote => {
      const job = await jobService.getJobById(quote.jobId);
      return { ...quote, job };
    })
  );

  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(quotesWithJobDetails.length / itemsPerPage));
  const rawPage = Number(resolvedSearchParams.page ?? "1");
  const currentPage = Number.isFinite(rawPage) && rawPage > 0 ? Math.min(Math.floor(rawPage), totalPages) : 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedQuotes = quotesWithJobDetails.slice(startIndex, startIndex + itemsPerPage);

  const depositPaidStatuses = new Set<PaymentStatus>([
    "deposit_paid",
    "pending_final",
    "fully_paid",
    "authorized",
    "captured",
    "succeeded"
  ]);

  return (
    <div className="space-y-8">
      <DashboardHeader
        title="My Submitted Quotes"
        description="View and manage your submitted quotes, monitor their status, and mark work as complete once finished."
      />

      {quotesWithJobDetails.length === 0 ? (
        <Card className="py-16 text-center">
          <CardContent className="space-y-4 text-muted-foreground">
            <FileText className="mx-auto h-12 w-12" />
            <h3 className="text-lg font-semibold text-foreground">You haven't submitted any quotes yet.</h3>
            <p>Find jobs on the job board to submit your first quote.</p>
            <Button asChild className="mt-2">
              <Link href="/dashboard/tradesperson/job-board">
                <Plus className="mr-2 h-4 w-4" /> Find Jobs to Quote
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Quotes ({quotesWithJobDetails.length})</CardTitle>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job</TableHead>
                  <TableHead>Date Submitted</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginatedQuotes.map(({ job, ...quote }) => {
                  const isAccepted = job?.acceptedQuoteId === quote.id;
                  const paymentStatus = job?.paymentStatus ?? null;
                  const hasDepositBeenPaid =
                    isAccepted && paymentStatus ? depositPaidStatuses.has(paymentStatus) : false;
                  const isFullyPaid = isAccepted && paymentStatus === "fully_paid";

                  return (
                    <TableRow key={quote.id}>
                      <TableCell>{job?.title || "Job"}</TableCell>
                      <TableCell>{formatDateShortGB(quote.createdAt)}</TableCell>
                      <TableCell>£{quote.price}</TableCell>

                      <TableCell>
                        {isAccepted ? (
                          <Badge variant="secondary" className="border-green-200 bg-green-100 text-green-800">
                            Accepted
                          </Badge>
                        ) : (
                          <Badge variant="outline">Pending</Badge>
                        )}
                      </TableCell>

                      <TableCell>
                        {isFullyPaid ? (
                          <Badge className="border-green-200 bg-green-100 text-green-800 hover:bg-green-100 dark:border-green-800 dark:bg-green-900/50 dark:text-green-300">
                            <CheckCircle className="mr-1.5 h-3 w-3" />
                            Paid in Full
                          </Badge>
                        ) : hasDepositBeenPaid ? (
                          <Badge className="border-blue-200 bg-blue-100 text-blue-800 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                            Deposit Paid
                          </Badge>
                        ) : isAccepted ? (
                          <Badge variant="outline">Awaiting</Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/dashboard/tradesperson/job-board/${quote.jobId}`}>View Job</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {quotesWithJobDetails.length > itemsPerPage && (
              <Pagination currentPage={currentPage} totalPages={totalPages} />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
