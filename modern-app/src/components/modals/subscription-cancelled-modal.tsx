// src/components/subscriptions/subscription-cancelled-modal.tsx

"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { XCircle } from "lucide-react";

import { BrandModal } from "@/components/modals/brand-modal";
import { Button } from "@/components/ui/button";

export default function SubscriptionCancelledModal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("subscription_cancelled")) {
      setIsOpen(true);
    }
  }, [searchParams]);

  const cleanUrlAndReplace = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("subscription_cancelled");
    router.replace(`${url.pathname}${url.search}`, { scroll: false });
  };

  const handleClose = () => {
    setIsOpen(false);
    cleanUrlAndReplace();
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
      icon={<XCircle className="h-6 w-6 text-destructive" />}
      title="Your subscription has been cancelled"
      description="Your Pro plan will not renew. You can continue to use all premium features until the end of your current billing period."
      size="sm">
      <div className="mt-6">
        <Button type="button" className="w-full" onClick={handleClose}>
          Got it
        </Button>
      </div>
    </BrandModal>
  );
}
