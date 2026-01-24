// src/components/payments/pay-deposit-button.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, CreditCard } from "lucide-react";
import type { Job } from "@/lib/types/job";
import type { Quote } from "@/lib/types/quote";
import { trackEvent } from "@/lib/analytics";

interface PayDepositButtonProps {
  job: Job;
  quote: Quote;
}

export default function PayDepositButton({ job, quote }: PayDepositButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    toast.info("Redirecting to secure payment...");

    try {
      // ✅ Fire analytics event before calling API
      trackEvent("deposit_initiated", {
        job_id: job.id,
        quote_id: quote.id,
        amount: quote.depositAmount ?? 0,
        role: "customer",
        stage: "deposit"
      });

      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: job.id,
          quoteId: quote.id,
          paymentType: "deposit",
          mode: "charge"
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create payment session.");
      }

      const { url } = await res.json();
      if (url) {
        window.location.href = url; // Redirects to Stripe Checkout
      } else {
        throw new Error("Could not retrieve payment URL.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An unexpected error occurred.");
      setLoading(false);
    }
  };

  return (
    <Button onClick={handlePayment} disabled={loading}>
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
      {loading ? "Redirecting..." : "Pay Deposit"}
    </Button>
  );
}
