"use client";

import React, { useState, useEffect, useActionState, useTransition } from "react";
import { AlertCircle, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

import { requestAccountDeletion } from "@/actions/data-privacy/deletion";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { firebaseError, isFirebaseError } from "@/utils/firebase-error";

// Update: Link the type directly to the refactored action
type DeleteAccountState = Awaited<ReturnType<typeof requestAccountDeletion>> | null;

export function AccountDeletion() {
  const { update } = useSession();
  const [confirmText, setConfirmText] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isTransitionPending, startTransition] = useTransition();

  // 1. Corrected Bridge Action
  const deleteAccountBridge = async (
    prevState: DeleteAccountState,
    formData: FormData // This is the payload from the form
  ): Promise<DeleteAccountState> => {
    // FIX: Pass the formData object to the action to satisfy its expected signature
    return await requestAccountDeletion(formData);
  };

  // 2. The Hook
  const [state, formAction, isPending] = useActionState(deleteAccountBridge, null);

  useEffect(() => {
    // Check for success using .ok
    if (state?.ok && !isRedirecting) {
      toast.success(state.data.message || "Account deletion request submitted");
      setDialogOpen(false);
      setIsRedirecting(true);

      const handleCompleteSignOut = async () => {
        try {
          if (typeof window !== "undefined") {
            // Clean up cookies and local storage
            document.cookie = "account-deleted=true; path=/; max-age=60";

            await signOut({ redirect: false });
            await update();

            setTimeout(() => {
              window.location.href = "/";
            }, 500);
          }
        } catch (error) {
          console.error("Error during sign out:", error);
          window.location.href = "/";
        }
      };

      handleCompleteSignOut();
    }
    // Handle error using !.ok
    else if (state && !state.ok) {
      const message = isFirebaseError(state.error)
        ? firebaseError(state.error)
        : state.error || "An unexpected error occurred";
      toast.error(message);
    }
  }, [state, update, isRedirecting]);

  const handleDeleteRequest = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (confirmText !== "DELETE") {
      toast.error("Please type DELETE to confirm");
      return;
    }

    const formData = new FormData(event.currentTarget);

    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <Card className="border-destructive/20 shadow-sm">
      <CardHeader>
        <CardTitle className="text-destructive flex items-center gap-2">
          <Trash2 className="h-5 w-5" />
          Danger Zone
        </CardTitle>
        <CardDescription>Once you delete your account, there is no going back. Please be certain.</CardDescription>
      </CardHeader>
      <CardContent>
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Deleting your account will permanently remove all your data, including order history and saved addresses.
          </AlertDescription>
        </Alert>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive">Delete My Account</Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleDeleteRequest}>
              <DialogHeader>
                <DialogTitle>Are you absolutely sure?</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. This will permanently delete your account and remove your data from our
                  servers.
                </DialogDescription>
              </DialogHeader>
              <div className="py-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="confirmText">
                    Type <span className="font-bold">DELETE</span> to confirm
                  </Label>
                  <Input
                    id="confirmText"
                    value={confirmText}
                    onChange={e => setConfirmText(e.target.value)}
                    placeholder="DELETE"
                    className="h-12"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={isPending || isTransitionPending || isRedirecting}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={confirmText !== "DELETE" || isPending || isTransitionPending || isRedirecting}>
                  {(isPending || isTransitionPending || isRedirecting) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isRedirecting ? "Finalizing..." : "Permanently Delete"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
