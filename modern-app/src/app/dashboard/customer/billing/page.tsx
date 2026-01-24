// src/app/dashboard/customer/billing/page.tsx
import Link from "next/link";
import { ArrowLeft, Receipt } from "lucide-react";

import { requireSession } from "@/lib/auth/require-session";
import { jobService } from "@/lib/services/job-service";
import { formatDateTimeGB } from "@/lib/utils";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";

const currencyFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP"
});

function getPaymentLabel(type: "deposit" | "final") {
  return type === "deposit" ? "Deposit" : "Final Payment";
}

export default async function CustomerBillingPage() {
  const session = await requireSession();
  const jobs = await jobService.getJobsByCustomer(session.user.id);

  const jobsWithPayments = jobs
    .map(job => {
      const payments = (job.payments ?? []).slice().sort((a, b) => b.paidAt.getTime() - a.paidAt.getTime());
      return {
        ...job,
        payments
      };
    })
    .filter(job => job.payments.length > 0);

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Billing History"
        description="Review payments for your jobs and access Stripe-hosted receipts."
        actions={
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/customer" aria-label="Back to customer dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
        }
      />

      {jobsWithPayments.length === 0 ? (
        <Card className="py-16 text-center">
          <CardContent className="space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Receipt className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold">No payment history yet</h3>
            <p className="text-muted-foreground">
              Once you pay a deposit or final balance, your receipts will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {jobsWithPayments.map(job => (
            <Card key={job.id}>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                    <CardTitle className="line-clamp-1">{job.title}</CardTitle>
                  </div>
                  <Button size="sm" asChild>
                    <Link href={`/dashboard/customer/jobs/${job.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      View job
                    </Link>
                  </Button>
                </div>
                <CardDescription>Payments recorded for this job.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payment</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead className="text-right">Receipt</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {job.payments.map(payment => {
                      const paidAt = formatDateTimeGB(payment.paidAt) ?? "—";
                      return (
                        <TableRow key={payment.paymentIntentId}>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {getPaymentLabel(payment.type)}
                            </Badge>
                          </TableCell>
                          <TableCell>{paidAt}</TableCell>
                          <TableCell>{currencyFormatter.format(payment.amount / 100)}</TableCell>
                          <TableCell className="text-right">
                            {payment.stripeReceiptUrl ? (
                              <Button variant="ghost" size="sm" asChild className="whitespace-nowrap">
                                <a href={payment.stripeReceiptUrl} target="_blank" rel="noopener noreferrer">
                                  View receipt
                                </a>
                              </Button>
                            ) : (
                              <Badge variant="secondary">Receipt unavailable</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
