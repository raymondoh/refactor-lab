"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { BrandModal } from "@/components/modals/brand-modal";
import { Button } from "@/components/ui/button";

export default function UserRoleUpdatedModal() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("user_role_updated")) {
      setIsOpen(true);
    }
  }, [searchParams]);

  const handleClose = () => {
    setIsOpen(false);

    const url = new URL(window.location.href);
    url.searchParams.delete("user_role_updated");
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
      title="User Role Updated"
      description="The user's permissions have been successfully changed."
      size="sm"
      footer={
        <Button className="w-full" onClick={handleClose}>
          Continue
        </Button>
      }>
      <p className="text-sm text-muted-foreground text-center">
        These changes take effect immediately across the dashboard and job management areas.
      </p>
    </BrandModal>
  );
}
