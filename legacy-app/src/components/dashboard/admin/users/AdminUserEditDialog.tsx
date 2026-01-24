//src/components/dashboard/admin/users/AdminUserEditDialog.tsx
"use client";

import { useState } from "react";
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
import type { UserRole } from "@/types/user";
import type { SerializedUser } from "@/types/user";
import { SubmitButton } from "@/components/shared/SubmitButton"; // make sure this is imported

interface AdminUserEditDialogProps {
  user: SerializedUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AdminUserEditDialog({ user, open, onOpenChange, onSuccess }: AdminUserEditDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: user.name || "",
    role: user.role || "user"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await updateUser(user.id, formData);
      if (result.success) {
        toast.success("User updated successfully");
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(result.error || "Failed to update user.");
      }
    } catch (error) {
      const message = isFirebaseError(error) ? firebaseError(error) : "An unexpected error occurred";
      console.error("Error updating user:", error);
      toast.error(message);
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
            <SubmitButton isLoading={isLoading} loadingText="Saving...">
              Save Changes
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
