"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import type { Job } from "@/lib/types/job";

// The component is a controlled dialog, receiving state from its parent
interface DeleteJobDialogProps {
  job: Job | null; // It can be null when no job is selected
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void; // Optional: callback to refresh data after deletion
}

export function DeleteJobDialog({ job, isOpen, onOpenChange, onSuccess }: DeleteJobDialogProps) {
  const handleDelete = async () => {
    if (!job) {
      toast.error("Error", { description: "No job selected for deletion." });
      return;
    }
    try {
      const response = await fetch(`/api/jobs/${job.id}`, {
        method: "DELETE"
      });
      if (!response.ok) {
        throw new Error("Failed to delete job");
      }
      toast.success("Job deleted", { description: `The job "${job.title}" has been successfully deleted.` });
      onOpenChange(false);
      onSuccess?.(); // Call the success callback if it exists
    } catch (error) {
      toast.error("Deletion failed", {
        description: error instanceof Error ? error.message : "There was a problem deleting the job."
      });
    }
  };

  // Don't render anything if there's no job
  if (!job) {
    return null;
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the job titled &quot;{job.title}&quot;.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
