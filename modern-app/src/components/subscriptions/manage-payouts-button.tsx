// src/components/subscriptions/manage-payouts-button.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// Add props to accept the completion status
interface ManagePayoutsButtonProps {
  stripeOnboardingComplete: boolean;
}

export default function ManagePayoutsButton({ stripeOnboardingComplete }: ManagePayoutsButtonProps) {
  const [loading, setLoading] = useState(false);

  // Determine button text dynamically
  const buttonText = stripeOnboardingComplete ? "Manage Payouts" : "Set Up Payouts";

  const onClick = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/connect/link", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Could not create Stripe link.", {
          description: data.error || "Please try again."
        });
      }
    } catch (err) {
      toast.error("An unexpected error occurred.", {
        description: err instanceof Error ? err.message : "Please try again later."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={onClick} disabled={loading}>
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {loading ? "Redirecting..." : buttonText}
    </Button>
  );
}
