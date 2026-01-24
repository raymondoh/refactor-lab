// src/components/payments/deposit-paid-modal.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { BrandModal } from "@/components/modals/brand-modal";
import { Button } from "@/components/ui/button";

export default function DepositPaidModal() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("deposit_paid")) {
      setIsOpen(true);
    }
  }, [searchParams]);

  const handleClose = () => {
    setIsOpen(false);

    const url = new URL(window.location.href);
    url.searchParams.delete("deposit_paid");

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
      title="Deposit Paid Successfully!"
      description="Your deposit has been processed. We’ve notified the tradesperson, and your booking is now secured."
      size="sm"
      footer={
        <Button className="w-full" onClick={handleClose}>
          View Job Details
        </Button>
      }>
      <p className="text-sm text-muted-foreground text-center">
        You can now view the job details and communicate with your tradesperson directly in your dashboard.
      </p>
    </BrandModal>
  );
}
