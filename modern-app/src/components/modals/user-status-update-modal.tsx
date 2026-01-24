"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { BrandModal } from "@/components/modals/brand-modal";
import { Button } from "@/components/ui/button";

export default function UserStatusUpdatedModal() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("user_status_updated")) {
      setIsOpen(true);
    }
  }, [searchParams]);

  const handleClose = () => {
    setIsOpen(false);

    // Clean up the URL by removing the query param
    const url = new URL(window.location.href);
    url.searchParams.delete("user_status_updated");
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
      title="User Status Updated"
      description="The user's account status has been successfully changed."
      size="sm"
      footer={
        <Button className="w-full" onClick={handleClose}>
          Continue
        </Button>
      }>
      <p className="text-sm text-muted-foreground text-center">
        Any changes to access or visibility will apply immediately across the platform.
      </p>
    </BrandModal>
  );
}
