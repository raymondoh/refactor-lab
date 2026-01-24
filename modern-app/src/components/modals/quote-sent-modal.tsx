// src/components/jobs/quote-sent-modal.tsx

"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { BrandModal } from "@/components/modals/brand-modal";
import { Button } from "@/components/ui/button";

export default function QuoteSentModal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("quote_sent")) {
      setIsOpen(true);
    }
  }, [searchParams]);

  const handleClose = () => {
    setIsOpen(false);
    const newPath = window.location.pathname;
    // Strip query params without full reload
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
      title="Your quote has been sent!"
      description="The customer has been notified. We’ll let you know if they accept your quote or send you a message."
      icon={<CheckCircle2 className="h-6 w-6 text-primary" />}
      size="sm"
      footer={
        <Button type="button" className="w-full" onClick={handleClose}>
          Back to Job Board
        </Button>
      }
    />
  );
}
