// // src/components/profile/profile-saved-modal.tsx

"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { BrandModal } from "@/components/modals/brand-modal";
import { Button } from "@/components/ui/button";

export default function ProfileSavedModal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  // Detect query param
  useEffect(() => {
    if (searchParams.get("profile_saved")) {
      setIsOpen(true);
    }
  }, [searchParams]);

  // Close + clean URL
  const handleClose = () => {
    setIsOpen(false);
    const url = new URL(window.location.href);
    url.searchParams.delete("profile_saved");
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
      title="Profile Updated"
      description="Your profile changes have been saved successfully."
      size="sm"
      footer={
        <Button onClick={handleClose} className="w-full">
          Back to Profile
        </Button>
      }>
      <p className="text-sm text-muted-foreground text-center">
        Your updated details are now visible to potential customers and tradespeople.
      </p>
    </BrandModal>
  );
}
