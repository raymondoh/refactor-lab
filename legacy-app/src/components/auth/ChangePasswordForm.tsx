// ChangePasswordForm.tsx
"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { Eye, EyeOff, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Auth } from "@/types";
import { firebaseError, isFirebaseError } from "@/utils/firebase-error";
// Import the server action directly.
import { updatePassword } from "@/actions/auth/password";

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [showSuccess, setShowSuccess] = useState(false);

  // Call the server action directly using useActionState.
  const [state, action, isPending] = useActionState<Auth.UpdatePasswordState, FormData>(updatePassword, {
    success: false
  });

  useEffect(() => {
    if (state?.success) {
      toast.success("Password updated successfully");
      setShowSuccess(true);

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => setShowSuccess(false), 5000);
    } else if (state?.error) {
      const message = isFirebaseError(state.error)
        ? firebaseError(state.error)
        : typeof state.error === "string"
        ? state.error
        : "An unexpected error occurred.";
      toast.error(message);
    }
  }, [state]);

  const validateForm = () => {
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return false;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return false;
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!validateForm()) {
      e.preventDefault();
    }
  };

  return (
    <div className="w-full">
      {state?.error && typeof state.error === "string" && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      {showSuccess && (
        <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription>Your password has been updated successfully.</AlertDescription>
        </Alert>
      )}
      <form action={action} onSubmit={handleSubmit} className="space-y-4">
        <PasswordInput
          id="currentPassword"
          label="Current Password"
          value={currentPassword}
          onChange={setCurrentPassword}
          show={showCurrentPassword}
          setShow={setShowCurrentPassword}
        />
        <PasswordInput
          id="newPassword"
          label="New Password"
          value={newPassword}
          onChange={setNewPassword}
          show={showNewPassword}
          setShow={setShowNewPassword}
        />
        <p className="text-sm text-muted-foreground -mt-2">
          Password must be 8–72 characters long and contain at least one uppercase letter, one lowercase letter, one
          number, and one special character.
        </p>
        <PasswordInput
          id="confirmPassword"
          label="Confirm New Password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          show={showConfirmPassword}
          setShow={setShowConfirmPassword}
        />
        <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating Password...
            </>
          ) : (
            "Update Password"
          )}
        </Button>
      </form>
    </div>
  );
}

function PasswordInput({
  id,
  label,
  value,
  onChange,
  show,
  setShow
}: {
  id: string;
  label: string;
  value: string;
  onChange: (val: string) => void;
  show: boolean;
  setShow: (val: boolean) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          name={id}
          type={show ? "text" : "password"}
          placeholder={label}
          required
          value={value}
          onChange={e => onChange(e.target.value)}
          className="pr-10"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
          onClick={() => setShow(!show)}>
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
