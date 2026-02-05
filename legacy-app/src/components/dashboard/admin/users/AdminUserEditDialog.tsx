// src/components/dashboard/admin/users/AdminUserEditDialog.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateUser } from "@/actions/user/admin";
import { toast } from "sonner";

import { firebaseError, isFirebaseError } from "@/utils/firebase-error";
import type { UserRole, SerializedUser } from "@/types/models/user";
import { SubmitButton } from "@/components/shared/SubmitButton"; // make sure this is imported

interface AdminUserEditDialogProps {
  user: SerializedUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AdminUserEditDialog({ user, open, onOpenChange, onSuccess }: AdminUserEditDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const initial = useMemo(
    () => ({
      name: user.name || "",
      role: (user.role || "user") as UserRole
    }),
    [user.name, user.role]
  );

  const [formData, setFormData] = useState(initial);

  // If a different user is passed in while dialog is reused, keep state in sync.
  useEffect(() => {
    setFormData(initial);
  }, [initial]);

  const hasChanges = formData.role !== initial.role || formData.name.trim() !== (initial.name || "").trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name: formData.name.trim(),
      role: formData.role
    };

    if (!hasChanges) {
      toast.message("No changes to save.");
      onOpenChange(false);
      return;
    }

    if (payload.name.length === 0) {
      toast.error("Name cannot be empty.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await updateUser(user.id, payload);

      if (!result.success) {
        toast.error(result.error || "Failed to update user.");
        return;
      }

      toast.success("User updated successfully");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>Update the user&apos;s name or role.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Role
              </Label>
              <Select
                value={formData.role}
                onValueChange={value => setFormData({ ...formData, role: value as UserRole })}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <SubmitButton isLoading={isLoading} loadingText="Saving..." disabled={!hasChanges}>
              Save Changes
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
