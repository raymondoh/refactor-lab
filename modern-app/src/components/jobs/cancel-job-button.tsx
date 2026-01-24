"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export function CancelJobButton({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleCancel = async (e: React.MouseEvent) => {
    // Prevent the modal from closing automatically while we load
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/jobs/${jobId}/cancel`, { method: "POST" });

      if (!res.ok) {
        throw new Error("Failed to cancel job");
      }

      toast.success("Job cancelled successfully");
      setOpen(false); // Close modal on success
      router.refresh();
    } catch (_error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="danger" className="w-full">
          Cancel Job
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel Job</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to cancel this job? This action cannot be undone and will remove the job from the
            board.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Keep Job</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCancel}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={loading}>
            {loading ? "Cancelling..." : "Yes, Cancel Job"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
