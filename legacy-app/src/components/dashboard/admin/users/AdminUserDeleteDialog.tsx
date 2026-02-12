// src/components/dashboard/admin/users/AdminUserDeleteDialog.tsx
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { SerializedUser } from "@/types/models/user";
import { SubmitButton } from "@/components/shared/SubmitButton";
import { deleteUserAsAdmin } from "@/actions/user/admin";

interface AdminUserDeleteDialogProps {
  user: SerializedUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AdminUserDeleteDialog({ user, open, onOpenChange, onSuccess }: AdminUserDeleteDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);

    const label = user.name || user.email || user.id;

    try {
      const result = await deleteUserAsAdmin(user.id);

      if (result.success) {
        toast.success(`User ${label} deleted successfully.`);
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(result.error || "Failed to delete user.");
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unexpected error occurred while deleting user.";
      toast.error(message);
      console.error("Delete user error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete User</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete <strong>{user.name || user.email || user.id}</strong>? This action cannot be
          undone.
        </p>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>

          <SubmitButton onClick={handleDelete} isLoading={loading} loadingText="Deleting..." variant="destructive">
            Delete
          </SubmitButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
