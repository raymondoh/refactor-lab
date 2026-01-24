"use client";

import { useCallback, useMemo, useState } from "react";
import { signOut } from "next-auth/react";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Icons } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export function DeleteAccountCard() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const isConfirmationValid = useMemo(() => confirmationText.trim().toUpperCase() === "DELETE", [confirmationText]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!isDeleting) {
        setIsDialogOpen(open);
        if (!open) {
          setConfirmationText("");
        }
      }
    },
    [isDeleting]
  );

  const handleDelete = useCallback(async () => {
    if (isDeleting || !isConfirmationValid) return;
    setIsDeleting(true);

    try {
      const response = await fetch("/api/account/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        }
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = typeof data?.error === "string" && data.error.trim().length > 0 ? data.error : "Failed to delete account.";
        throw new Error(message);
      }

      toast.success("Account deleted", {
        description: "Your account and all related data have been removed."
      });

      setIsDialogOpen(false);
      setConfirmationText("");

      await signOut({ redirect: true, callbackUrl: "/" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete account.";
      toast.error("Deletion failed", {
        description: message
      });
    } finally {
      setIsDeleting(false);
    }
  }, [isConfirmationValid, isDeleting]);

  return (
    <Card className="border-destructive/40 bg-destructive/5">
      <CardHeader>
        <CardTitle className="text-destructive">Danger Zone</CardTitle>
        <CardDescription>
          Permanently delete your account, including your jobs, quotes, saved items, and profile data. This action cannot be undone.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AlertDialog open={isDialogOpen} onOpenChange={handleOpenChange}>
          <AlertDialogTrigger asChild>
            <Button variant="danger">Delete My Account</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete account permanently?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove your account and all associated data, including jobs, quotes, reviews, and profile information. This action cannot
                be undone. To confirm, please type <span className="font-semibold">DELETE</span> below.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Input
              autoFocus
              value={confirmationText}
              onChange={event => setConfirmationText(event.target.value)}
              placeholder="Type DELETE to confirm"
              className="mt-4"
            />
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={event => {
                  event.preventDefault();
                  handleDelete();
                }}
                disabled={!isConfirmationValid || isDeleting}
                className={cn(buttonVariants({ variant: "danger" }), "min-w-[12rem]")}
              >
                {isDeleting ? <Icons.spinner className="mr-2 h-4 w-4 animate-spin" /> : null}
                Yes, delete my account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
