"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { auth } from "@/firebase/client/firebase-client-init";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { updatePasswordHash, getUserIdByEmail } from "@/actions/auth/reset-password";
import { firebaseError, isFirebaseError } from "@/utils/firebase-error";
import { SubmitButton } from "@/components/shared/SubmitButton";
import { UniversalPasswordInput } from "@/components/forms/UniversalPasswordInput";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<"verifying" | "ready" | "submitting" | "success" | "error">("verifying");
  const [errorMessage, setErrorMessage] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [oobCode, setOobCode] = useState("");
  const [userId, setUserId] = useState("");

  function resetForm() {
    setPassword("");
    setConfirmPassword("");
    setErrorMessage("");
    setStatus("ready");
  }

  useEffect(() => {
    const mode = searchParams.get("mode");
    const code = searchParams.get("oobCode");

    if (mode === "resetPassword" && code) {
      setOobCode(code);

      const verifyCode = async () => {
        try {
          const email = await verifyPasswordResetCode(auth, code);
          setEmail(email);

          const result = await getUserIdByEmail({ email });
          if (result.success && result.userId) {
            setUserId(result.userId);
          }

          setStatus("ready");
        } catch (err) {
          console.error("[RESET_PASSWORD][VERIFY_CODE]", err);
          const msg = isFirebaseError(err) ? firebaseError(err) : "Invalid or expired password reset link";
          setErrorMessage(msg);
          setStatus("error");
        }
      };

      verifyCode();
    } else if (mode === "verifyEmail") {
      router.push(`/verify-email?${searchParams.toString()}`);
    } else {
      setErrorMessage("Invalid password reset link");
      setStatus("error");
    }
  }, [searchParams, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    setStatus("submitting");

    try {
      await confirmPasswordReset(auth, oobCode, password);

      const resolvedUserId = userId || (await getUserIdByEmail({ email })).userId;
      if (resolvedUserId) {
        await updatePasswordHash({ userId: resolvedUserId, newPassword: password });
      }

      setStatus("success");
      toast.success("Password reset successful! You can now log in.");

      setTimeout(() => router.push("/login"), 3000);
    } catch (err) {
      console.error("[RESET_PASSWORD][SUBMIT]", err);
      const msg = isFirebaseError(err) ? firebaseError(err) : "Failed to reset password";
      setErrorMessage(msg);
      setStatus("error");
      toast.error(msg);
    }
  };

  if (status === "success") {
    return (
      <div className="w-full">
        <div className="relative py-8 sm:py-10 text-center">
          <div className="flex justify-center mb-6">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
          </div>

          <div className="space-y-2 mb-6">
            <h1 className="text-3xl font-semibold tracking-tight">Password Reset Successful!</h1>
            <p className="text-muted-foreground">Your password has been reset successfully.</p>
          </div>

          <div className="mt-8">
            <Button asChild className="w-full h-14 text-lg font-semibold">
              <Link href="/login">Continue to Login</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="w-full">
        <div className="relative py-8 sm:py-10 text-center">
          <div className="flex justify-center mb-6">
            <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center">
              <XCircle className="h-10 w-10 text-destructive" />
            </div>
          </div>

          <div className="space-y-2 mb-6">
            <h1 className="text-3xl font-semibold tracking-tight">Reset Link Invalid</h1>
            <p className="text-muted-foreground">{errorMessage}</p>
          </div>

          <div className="mt-8">
            <Button
              variant="default"
              className="w-full h-14 text-lg font-semibold"
              onClick={() => {
                resetForm();
                router.push("/forgot-password");
              }}>
              Request New Reset Link
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="relative py-8 sm:py-10">
        <div className="flex justify-center mb-6">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
            <KeyRound className="h-10 w-10 text-primary" />
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold mb-2">Reset Your Password</h1>
          <p className="text-muted-foreground">Create a new password for {email}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <UniversalPasswordInput
            id="password"
            label="New Password"
            value={password}
            onChange={setPassword}
            placeholder="Enter new password"
            required
          />

          <UniversalPasswordInput
            id="confirmPassword"
            label="Confirm New Password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Confirm new password"
            required
          />

          <SubmitButton
            isLoading={status === "submitting"}
            loadingText="Resetting..."
            className="w-full h-14 text-lg font-bold">
            Reset Password
          </SubmitButton>
        </form>

        <div className="pt-6 text-center">
          <p className="text-base text-muted-foreground">
            Remember your password?{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
