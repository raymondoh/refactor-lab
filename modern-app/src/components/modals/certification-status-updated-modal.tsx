"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { BrandModal } from "@/components/modals/brand-modal";
import { Button } from "@/components/ui/button";

export default function CertificationStatusUpdatedModal() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("certification_status_updated")) {
      setIsOpen(true);
    }
  }, [searchParams]);

  const handleClose = () => {
    setIsOpen(false);

    // Remove query param
    const url = new URL(window.location.href);
    url.searchParams.delete("certification_status_updated");

    router.replace(`${url.pathname}${url.search}`, { scroll: false });
  };

  return (
    <BrandModal
      open={isOpen}
      onOpenChange={open => {
        if (!open) handleClose();
        else setIsOpen(true);
      }}
      icon={<CheckCircle2 className="h-6 w-6 text-primary" />}
      title="Certification Status Updated"
      description="The tradesperson has been notified of the change."
      size="sm"
      footer={
        <Button className="w-full" onClick={handleClose}>
          Continue
        </Button>
      }>
      <p className="text-sm text-muted-foreground text-center">
        You can review their updated documents at any time in the admin dashboard.
      </p>
    </BrandModal>
  );
}
