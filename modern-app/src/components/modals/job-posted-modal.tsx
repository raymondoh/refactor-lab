// src/components/jobs/job-posted-modal.tsx

"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { BrandModal } from "@/components/modals/brand-modal";
import { Button } from "@/components/ui/button";

export default function JobPostedModal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("job_posted")) {
      setIsOpen(true);
    }
  }, [searchParams]);

  const handleClose = () => {
    setIsOpen(false);
    const newPath = window.location.pathname;
    // Remove query params without a full reload
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
      title="Your job has been posted!"
      description="Tradespeople in your area will now be able to view your job and send you quotes. We'll notify you as soon as the first quote arrives."
      icon={<CheckCircle2 className="h-6 w-6 text-primary" />}
      size="sm"
      footer={
        <Button type="button" className="w-full" onClick={handleClose}>
          View My Jobs
        </Button>
      }
    />
  );
}
