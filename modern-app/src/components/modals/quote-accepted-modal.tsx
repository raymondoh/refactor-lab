// src/components/jobs/quote-accepted-modal.tsx

"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { BrandModal } from "@/components/modals/brand-modal";
import { Button } from "@/components/ui/button";

export default function QuoteAcceptedModal() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("quote_accepted")) {
      setIsOpen(true);
    }
  }, [searchParams]);

  const handleClose = () => {
    setIsOpen(false);

    const newPath = window.location.pathname;
    router.replace(newPath, { scroll: false });
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
      title="Quote accepted!"
      description={
        <>
          We've notified the tradesperson that you've accepted their quote. They’ll contact you shortly to arrange the
          job.
          <br />
          <span className="font-semibold text-foreground">
            Please now make a deposit payment to confirm the booking.
          </span>
        </>
      }
      icon={<CheckCircle2 className="h-6 w-6 text-primary" />}
      size="sm"
      footer={
        <Button type="button" className="w-full" onClick={handleClose}>
          Back to Job Details
        </Button>
      }
    />
  );
}
