// src/components/admin/user-deleted-modal.tsx

"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { BrandModal } from "@/components/modals/brand-modal";
import { Button } from "@/components/ui/button";

export default function UserDeletedModal() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("user_deleted")) {
      setIsOpen(true);
    }
  }, [searchParams]);

  const handleClose = () => {
    setIsOpen(false);

    const url = new URL(window.location.href);
    url.searchParams.delete("user_deleted");

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
      title="User Deleted Successfully"
      description="The user and all associated data have been permanently removed from the system."
      size="sm"
      footer={
        <Button className="w-full" onClick={handleClose}>
          Continue
        </Button>
      }>
      <p className="text-sm text-muted-foreground text-center">
        This action cannot be undone. If needed, you can create a new user via the admin dashboard.
      </p>
    </BrandModal>
  );
}
