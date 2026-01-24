// src/components/reviews/review-submitted-modal.tsx

"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, Star } from "lucide-react";

import { BrandModal } from "@/components/modals/brand-modal";
import { Button } from "@/components/ui/button";

export default function ReviewSubmittedModal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  const googleReviewUrl = searchParams.get("google_review_url");

  useEffect(() => {
    if (searchParams.get("review_submitted")) {
      setIsOpen(true);
    }
  }, [searchParams]);

  const cleanUrlAndReplace = () => {
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    url.searchParams.delete("review_submitted");
    url.searchParams.delete("google_review_url");
    router.replace(`${url.pathname}${url.search}`, { scroll: false });
  };

  const handleClose = () => {
    setIsOpen(false);
    cleanUrlAndReplace();
  };

  const handleShare = () => {
    if (googleReviewUrl) {
      window.open(googleReviewUrl, "_blank", "noopener,noreferrer");
    }
    handleClose();
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
      title="Thank you for your feedback!"
      description="Your review helps other customers. Would you also be willing to share your review on Google to help this tradesperson grow their business?"
      size="md">
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button type="button" variant="subtle" className="w-full sm:w-auto" onClick={handleClose}>
          Maybe later
        </Button>

        {googleReviewUrl && (
          <Button type="button" variant="primary" className="w-full sm:w-auto" onClick={handleShare}>
            <Star className="mr-2 h-4 w-4" />
            Share on Google
          </Button>
        )}
      </div>
    </BrandModal>
  );
}
