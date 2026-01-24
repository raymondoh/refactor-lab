"use client";

import { useState } from "react";
import { useRouter } from "next/navigation"; // <-- 1. Import useRouter
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface VerifyCertificationActionsProps {
  userId: string;
  certId: string;
  approveLabel?: string;
  rejectLabel?: string;
  // onComplete is no longer needed because we will redirect
}

export default function VerifyCertificationActions({
  userId,
  certId,
  approveLabel = "Approve",
  rejectLabel = "Reject"
}: VerifyCertificationActionsProps) {
  const router = useRouter(); // <-- 2. Initialize the router
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);

  const handle = async (verified: boolean) => {
    try {
      setLoading(verified ? "approve" : "reject");
      const res = await fetch("/api/admin/certifications/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, certificationId: certId, verified })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Request failed");
      }

      // --- THIS IS THE FIX ---
      // Instead of a toast, we redirect to trigger the modal.
      router.push("/dashboard/admin/certifications?certification_status_updated=true");
      router.refresh(); // This will re-fetch the data on the page.
    } catch (err) {
      toast.error("Action failed", { description: err instanceof Error ? err.message : String(err) });
      setLoading(null); // Only set loading to false on error
    }
    // On success, we navigate away, so no need to set loading to false.
  };

  return (
    <div className="flex gap-2 justify-end">
      <Button size="sm" disabled={loading !== null} onClick={() => handle(true)}>
        {loading === "approve" ? <Loader2 className="h-4 w-4 animate-spin" /> : approveLabel}
      </Button>
      <Button size="sm" variant="danger" disabled={loading !== null} onClick={() => handle(false)}>
        {loading === "reject" ? <Loader2 className="h-4 w-4 animate-spin" /> : rejectLabel}
      </Button>
    </div>
  );
}
