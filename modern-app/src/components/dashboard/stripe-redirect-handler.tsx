// src/components/dashboard/stripe-redirect-handler.tsx
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

interface StripeRedirectHandlerProps {
  stripeOnboardingComplete: boolean;
}

export function StripeRedirectHandler({ stripeOnboardingComplete }: StripeRedirectHandlerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const connectStatus = searchParams.get("connect");

    if (connectStatus === "done") {
      if (stripeOnboardingComplete) {
        toast.success("Stripe payouts ready", {
          description: "You're all set to receive payments."
        });
        router.replace("/dashboard/tradesperson");
        return;
      }

      let cancelled = false;
      const verifyStatus = async () => {
        try {
          const response = await fetch("/api/stripe/connect/status", { cache: "no-store" });
          if (!response.ok) {
            throw new Error("Failed to refresh Stripe status");
          }
          const data = (await response.json()) as {
            stripeOnboardingComplete?: boolean;
            stripeChargesEnabled?: boolean;
          };
          const payoutsReady = Boolean(data?.stripeOnboardingComplete || data?.stripeChargesEnabled);

          if (payoutsReady) {
            toast.success("Stripe payouts ready", {
              description: "You're all set to receive payments."
            });
          } else {
            toast.warning("Finish Stripe onboarding", {
              description: "Please complete the remaining steps before retrying."
            });
          }
        } catch (error) {
          const description = error instanceof Error ? error.message : "Please try again.";
          toast.error("Unable to verify Stripe status", { description });
        } finally {
          if (cancelled) return;
          router.replace("/dashboard/tradesperson");
          router.refresh();
        }
      };

      verifyStatus();
      return () => {
        cancelled = true;
      };
    } else if (connectStatus === "retry") {
      // Handle the case where Stripe redirects back to refresh_url
      toast.warning("Stripe Connection Issue", {
        description: "There was an issue with the connection flow. Please try again."
      });

      // Clear the query parameter without refreshing the data
      router.replace("/dashboard/tradesperson");
    }
  }, [searchParams, router, stripeOnboardingComplete]);

  // This component renders nothing; it only manages side effects.
  return null;
}
