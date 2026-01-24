"use client";

import React, { useState, useEffect, useActionState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

import { requestAccountDeletion } from "@/actions/data-privacy/deletion";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { firebaseError, isFirebaseError } from "@/utils/firebase-error";

export function AccountDeletion() {
  const router = useRouter();
  const { update } = useSession();
  const [confirmText, setConfirmText] = useState("");
  const [immediateDelete, setImmediateDelete] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(requestAccountDeletion, null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (state?.success && !isRedirecting) {
      // Fix: Use a hardcoded success message instead of state.message
      toast.success("Account deletion request submitted");
      setDialogOpen(false);

      // Fix: Check if shouldRedirect exists before using it
      if ("shouldRedirect" in state && state.shouldRedirect) {
        setIsRedirecting(true);

        const handleCompleteSignOut = async () => {
          try {
            if (typeof window !== "undefined") {
              localStorage.removeItem("next-auth.session-token");
              localStorage.removeItem("next-auth.callback-url");
              localStorage.removeItem("next-auth.csrf-token");

              sessionStorage.removeItem("next-auth.session-token");
              sessionStorage.removeItem("next-auth.callback-url");
              sessionStorage.removeItem("next-auth.csrf-token");

              document.cookie = "account-deleted=true; path=/; max-age=60";

              window.dispatchEvent(
                new StorageEvent("storage", {
                  key: "next-auth.session-token",
                  newValue: null
                })
              );
            }

            await signOut({ redirect: false });
            await update();

            setTimeout(() => {
              window.location.href = "/";
            }, 500);
          } catch (error) {
            console.error("Error during sign out process:", error);
            window.location.href = "/";
          }
        };

        handleCompleteSignOut();
      }
    } else if (state && !state.success) {
      // Fix: Access error property correctly
      const message = isFirebaseError(state.error)
        ? firebaseError(state.error)
        : typeof state.error === "string"
        ? state.error
        : "An unexpected error occurred";
      toast.error(message);
    }
  }, [state, router, update, isRedirecting]);

  const handleDeleteRequest = (event: React.FormEvent) => {
    event.preventDefault();

    if (confirmText !== "DELETE") {
      toast.error("Please type DELETE to confirm");
      return;
    }

    // Use the form action directly without arguments
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);

    React.startTransition(() => {
      formAction(); // Call without arguments as expected by useActionState
    });
  };

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader>
        <CardTitle className="text-red-600">Delete Account</CardTitle>
        <CardDescription>Permanently delete your account and all associated data</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start gap-4 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
          <div className="space-y-1">
            <p className="font-medium text-red-800">Warning: This action cannot be undone</p>
            <p className="text-sm text-red-700">
              Deleting your account will permanently remove all your data, including profile information, activity
              history, and preferences. You will not be able to recover this information later.
            </p>
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive" className="gap-2 w-full sm:w-auto">
              <Trash2 className="h-4 w-4" />
              Request Account Deletion
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Are you absolutely sure?</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete your account and remove all your data from
                our servers.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleDeleteRequest} className="space-y-4 py-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  All your personal data, uploads, and activity history will be permanently deleted.
                </AlertDescription>
              </Alert>

              <div className="flex items-center space-x-2 py-2">
                <Checkbox
                  id="immediate-delete"
                  name="immediateDelete"
                  checked={immediateDelete}
                  onCheckedChange={checked => setImmediateDelete(checked === true)}
                />
                <Label
                  htmlFor="immediate-delete"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Delete my account immediately
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                {immediateDelete
                  ? "Your account will be deleted immediately and you will be logged out."
                  : "Your deletion request will be processed within 30 days."}
              </p>

              <div className="space-y-2 pt-2">
                <Label htmlFor="confirm">Type DELETE to confirm</Label>
                <Input
                  id="confirm"
                  name="confirm"
                  value={confirmText}
                  onChange={e => setConfirmText(e.target.value)}
                  placeholder="DELETE"
                />
              </div>

              <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={confirmText !== "DELETE" || isPending || isRedirecting}
                  className="w-full sm:w-auto">
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : isRedirecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Redirecting...
                    </>
                  ) : (
                    "Delete Account"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {state?.success && (
          <Alert className="mt-4 bg-yellow-50 text-yellow-800 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription>Your account deletion request has been submitted.</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
