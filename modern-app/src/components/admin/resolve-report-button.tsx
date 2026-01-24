// src/components/admin/resolve-report-button.tsx
"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface ResolveReportButtonProps {
  jobId: string;
  reportId: string;
  status: string;
}

export function ResolveReportButton({ jobId, reportId, status }: ResolveReportButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // ✅ If already resolved, render nothing
  if (status === "resolved") {
    return null;
  }

  const handleResolve = () => {
    startTransition(async () => {
      try {
        const res = await fetch("/api/messages/report/resolve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId, reportId })
        });

        if (!res.ok) {
          const text = await res.text();
          console.error("Failed to resolve report", {
            status: res.status,
            statusText: res.statusText,
            body: text
          });
          return;
        }

        router.refresh();
      } catch (err) {
        console.error("Error resolving report", err);
      }
    });
  };

  return (
    <Button size="sm" variant="secondary" onClick={handleResolve} disabled={isPending}>
      {isPending ? "Resolving..." : "Mark resolved"}
    </Button>
  );
}
