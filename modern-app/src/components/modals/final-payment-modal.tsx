// src/components/payments/final-payment-modal.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { BrandModal } from "@/components/modals/brand-modal";
import { Button } from "@/components/ui/button";

export default function FinalPaymentModal() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("final_payment_made")) {
      setIsOpen(true);
    }
  }, [searchParams]);

  const handleClose = () => {
    setIsOpen(false);

    const url = new URL(window.location.href);
    url.searchParams.delete("final_payment_made");

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
      icon={<CheckCircle2 className="h-6 w-6 text-primary" />}
      title="Final Payment Successful!"
      description="Your final payment has been processed and the job is now marked as complete."
      size="sm"
      footer={
        <Button className="w-full" onClick={handleClose}>
          View Job Details
        </Button>
      }>
      <p className="text-sm text-muted-foreground text-center">
        Thank you for using Plumbers Portal. You can now review your tradesperson and keep track of all your jobs from
        your dashboard.
      </p>
    </BrandModal>
  );
}
