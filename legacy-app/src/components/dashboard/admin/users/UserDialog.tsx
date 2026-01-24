"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AddUserForm } from "./AddUserForm";

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function UserDialog({ open, onOpenChange, onSuccess }: UserDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>Fill out the form to create a new user account.</DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <AddUserForm onSuccess={onSuccess} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
