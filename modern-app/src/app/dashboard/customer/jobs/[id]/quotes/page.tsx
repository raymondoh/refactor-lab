// src/app/dashboard/customer/jobs/[id]/quotes/page.tsx
import { requireSession } from "@/lib/auth/require-session";
import { notFound } from "next/navigation";
import { jobService } from "@/lib/services/job-service";
import { userService } from "@/lib/services/user-service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, FileText, Calendar, Clock, CheckCircle } from "lucide-react";
import { acceptQuote } from "@/actions/jobs/accept-quote";
import { formatDateGB } from "@/lib/utils";
import PayDepositButton from "@/components/payments/pay-deposit-button";
import { LiabilityDisclaimer } from "@/components/legal/liability-disclaimer";
import { QuoteAcceptedTracker } from "@/components/analytics/quote-accepted-tracker";
import type { QuoteLineItem } from "@/lib/types/quote";

interface QuotesPageProps {
  params: Promise<{ id: string }>;
}

function getLineItemSubtotal(item: QuoteLineItem): number {
  const base = item.quantity * item.unitPrice;
  const vatMultiplier = item.vatRate ? 1 + item.vatRate / 100 : 1;
  return base * vatMultiplier;
}

export default async function JobQuotesPage({ params }: QuotesPageProps) {
  const { id } = await params;
  const session = await requireSession();

  const job = await jobService.getJobById(id);
  if (!job || (session.user.role === "customer" && job.customerId !== session.user.id)) {
    notFound();
  }

  const quotes = await jobService.getQuotesByJobId(id);
  const quotesWithNames = await Promise.all(
    quotes.map(async q => {
      const tradesperson = await userService.getUserById(q.tradespersonId);
      return { ...q, tradespersonName: tradesperson?.name || "Tradesperson" };
    })
  );

  const depositPaidStatuses = new Set([
    "deposit_paid",
    "pending_final",
    "fully_paid",
    "authorized",
    "captured",
    "succeeded"
  ]);
  const hasDepositBeenPaid = job.paymentStatus ? depositPaidStatuses.has(job.paymentStatus) : false;

  return (
    <div className="space-y-6">
      <QuoteAcceptedTracker />
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/customer/jobs/${job.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Quotes for "{job.title}"</h1>
          <p className="text-muted-foreground">Review the quotes submitted by tradespeople for this job.</p>
        </div>
      </div>

      {quotesWithNames.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold">No quotes received yet.</h3>
            <p className="text-muted-foreground">
              You will be notified when a tradesperson submits a quote for this job.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quotesWithNames.map(quote => {
              const isAccepted = job.acceptedQuoteId === quote.id;
              const needsDeposit = (quote.depositAmount ?? 0) > 0;

              return (
                <Card key={quote.id} className="flex flex-col">
                  <CardHeader>
                    <CardTitle>
                      <Link
                        href={`/dashboard/customer/tradesperson/${quote.tradespersonId}`}
                        className="hover:underline">
                        {quote.tradespersonName}
                      </Link>
                    </CardTitle>
                    <CardDescription className="font-semibold text-primary text-lg">£{quote.price}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 flex-grow flex flex-col">
                    <p className="text-muted-foreground line-clamp-4 flex-grow">{quote.description}</p>

                    {quote.lineItems && quote.lineItems.length > 0 && (
                      <details className="mt-1 text-sm">
                        <summary className="cursor-pointer text-primary">View cost breakdown</summary>
                        <div className="mt-3 space-y-2">
                          <div className="grid grid-cols-2 text-xs text-muted-foreground">
                            <span>Item</span>
                            <span className="text-right">Total</span>
                          </div>
                          <div className="space-y-1">
                            {quote.lineItems.map(item => {
                              const subtotal = getLineItemSubtotal(item);
                              const label = item.label || item.description;
                              return (
                                <div key={item.id} className="flex items-start justify-between gap-3 text-xs">
                                  <div>
                                    <div className="font-medium text-foreground">{label}</div>
                                    <div className="text-muted-foreground">
                                      {item.quantity} × £{item.unitPrice.toFixed(2)}{" "}
                                      {item.unit && <span className="lowercase">({item.unit})</span>}
                                      {typeof item.vatRate === "number" && ` + ${item.vatRate}% VAT`}
                                    </div>
                                    {item.warrantyText && (
                                      <div className="mt-0.5 text-[11px] text-muted-foreground">
                                        {item.warrantyText}
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-right font-semibold">£{subtotal.toFixed(2)}</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </details>
                    )}

                    <div className="space-y-2 text-sm text-muted-foreground pt-4 border-t">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>Est. Duration: {quote.estimatedDuration}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Available from: {formatDateGB(quote.availableDate)}</span>
                      </div>
                    </div>

                    <div className="mt-auto w-full">
                      {isAccepted ? (
                        needsDeposit && !hasDepositBeenPaid ? (
                          <PayDepositButton job={job} quote={quote} />
                        ) : (
                          <Button disabled variant="secondary" className="w-full">
                            <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Quote Accepted
                          </Button>
                        )
                      ) : job.status === "open" || job.status === "quoted" ? (
                        <form action={acceptQuote} className="w-full">
                          <input type="hidden" name="jobId" value={job.id} />
                          <input type="hidden" name="quoteId" value={quote.id} />
                          <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                            Accept Quote
                          </Button>
                        </form>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <LiabilityDisclaimer context="customer" variant="subtle" className="mt-6" />
        </>
      )}
    </div>
  );
}
