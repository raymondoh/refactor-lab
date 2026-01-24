// src/components/payments/stripe-onboarding-complete-modal.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { BrandModal } from "@/components/modals/brand-modal";
import { Button } from "@/components/ui/button";

interface StripeOnboardingCompleteModalProps {
  stripeOnboardingComplete: boolean;
}

export default function StripeOnboardingCompleteModal({
  stripeOnboardingComplete
}: StripeOnboardingCompleteModalProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (stripeOnboardingComplete && searchParams.get("connect") === "done") {
      setIsOpen(true);
    }
  }, [searchParams, stripeOnboardingComplete]);

  const handleClose = () => {
    setIsOpen(false);

    const url = new URL(window.location.href);
    url.searchParams.delete("connect");

    router.replace(`${url.pathname}${url.search}`, { scroll: false });
  };

  return (
    <BrandModal
      open={isOpen}
      onOpenChange={open => {
        if (!open) {
          handleClose();
        } else {
          setIsOpen(true);
        }
      }}
      title="Payouts Enabled!"
      description="Your Stripe account has been successfully connected. You can now receive payments directly to your bank account."
      icon={<CheckCircle2 className="h-6 w-6 text-primary" />}
      size="sm"
      footer={
        <Button className="w-full" onClick={handleClose}>
          Great!
        </Button>
      }
    />
  );
}
