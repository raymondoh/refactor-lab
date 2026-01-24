// src/components/subscriptions/payment-success-modal.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { CheckCircle2, Rocket, Briefcase } from "lucide-react";

import { BrandModal } from "@/components/modals/brand-modal";
import { Button } from "@/components/ui/button";
import { clientLogger } from "@/lib/utils/logger";

export default function PaymentSuccessModal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { update } = useSession();

  const [isOpen, setIsOpen] = useState(false);
  const [plan, setPlan] = useState("");
  const hasHandledRef = useRef(false);

  useEffect(() => {
    const successParam = searchParams.get("payment_success");
    const planParam = searchParams.get("plan");

    if (!successParam) return;

    // prevent repeated handling in React strict mode / rerenders
    if (hasHandledRef.current) {
      return;
    }
    hasHandledRef.current = true;

    clientLogger.info("[DEBUG] PaymentSuccessModal: 'payment_success' param found.");
    const newTier = planParam || "pro";
    setPlan(newTier.charAt(0).toUpperCase() + newTier.slice(1));
    setIsOpen(true);

    clientLogger.info("[DEBUG] PaymentSuccessModal: Calling session.update() to refetch user data...");
    update()
      .then(() => {
        clientLogger.info("[DEBUG] PaymentSuccessModal: session.update() complete.");
      })
      .catch(err => {
        clientLogger.error("[DEBUG] PaymentSuccessModal: Failed to force-update session:", err);
      });
  }, [searchParams, update]);

  const cleanUrlAndReplace = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("payment_success");
    url.searchParams.delete("plan");
    router.replace(`${url.pathname}${url.search}`, { scroll: false });
  };

  const handleClose = () => {
    setIsOpen(false);
    clientLogger.info("[DEBUG] PaymentSuccessModal: Closing modal and removing URL params.");
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
      icon={<CheckCircle2 className="h-6 w-6 text-primary" />}
      title={`Welcome to the ${plan || "Pro"} Plan!`}
      description="Here are a couple of things you can do now to get the most out of your new features:"
      size="sm">
      <div className="mt-4 space-y-3">
        <Link href="/dashboard/tradesperson/profile/edit" onClick={handleClose} className="block">
          <div className="flex-1 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50">
            <div className="flex items-center gap-3">
              <Rocket className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-semibold">Feature Your Profile</p>
                <p className="text-xs text-muted-foreground">Update your details to stand out in search results.</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/dashboard/tradesperson/job-board" onClick={handleClose} className="block">
          <div className="flex-1 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50">
            <div className="flex items-center gap-3">
              <Briefcase className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-semibold">Find Exclusive Jobs</p>
                <p className="text-xs text-muted-foreground">Start quoting on jobs reserved for Pro members.</p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      <div className="mt-6">
        <Button type="button" className="w-full" onClick={handleClose}>
          Continue to Dashboard
        </Button>
      </div>
    </BrandModal>
  );
}
