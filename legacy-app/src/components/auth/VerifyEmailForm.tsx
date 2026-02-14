"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, LoaderCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { auth } from "@/firebase/client/firebase-client-init";
//import { getVerificationSettings } from "@/firebase/client/auth";
//import { signInWithEmailAndPassword, sendEmailVerification } from "firebase/auth";

import { UniversalInput } from "@/components/forms/UniversalInput";
import { UniversalPasswordInput } from "@/components/forms/UniversalPasswordInput";
import { resendVerification } from "@/actions/auth/resend-verification";

type VerifyStatus = "instructions" | "loading" | "success" | "error";

type VerifyOk = {
  success: true;
  message: string;
  role?: string;
  redirectPath?: string;
};

type VerifyErr = { error: string; reason?: string | null } | { error: string };

export function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<VerifyStatus>("instructions");
  const [errorMessage, setErrorMessage] = useState("");
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Resend state
  const [resendEmail, setResendEmail] = useState("");
  const [resendPassword, setResendPassword] = useState("");
  const [isResending, setIsResending] = useState(false);

  const attempted = useRef(false);
  const lastKey = useRef<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");
    const mode = searchParams.get("mode");
    const oobCode = searchParams.get("oobCode");

    const isFirebaseVerify = mode === "verifyEmail" && !!oobCode;
    const isCustomVerify = !!token;

    if (!isCustomVerify && !isFirebaseVerify) {
      setStatus("instructions");
      return;
    }

    const currentKey = token || oobCode || "";
    if (attempted.current && lastKey.current === currentKey) return;

    attempted.current = true;
    lastKey.current = currentKey;

    setStatus("loading");
    setErrorMessage("");

    const run = async () => {
      try {
        const payload = token ? { token } : { oobCode, mode };

        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          cache: "no-store"
        });

        const data = (await res.json()) as VerifyOk | VerifyErr;

        if (!res.ok) {
          const msg =
            "error" in data && typeof data.error === "string" ? data.error : "Invalid or expired verification link.";
          setStatus("error");
          setErrorMessage(msg);
          return;
        }

        if ("success" in data && data.success) {
          const nextPath = data.redirectPath?.startsWith("/") ? data.redirectPath : "/user";
          setIsRedirecting(true);
          router.replace(`/login?redirect=${encodeURIComponent(nextPath)}`);
          return;
        }

        setStatus("success");
      } catch (error: unknown) {
        console.error("Verification error:", error);
        setStatus("error");
        setErrorMessage("An unexpected error occurred. Please try again.");
      }
    };

    void run();
  }, [searchParams, router]);

  async function handleResendVerification() {
    if (!resendEmail) {
      toast.error("Please enter your email address.");
      return;
    }

    setIsResending(true);

    try {
      const result = await resendVerification(resendEmail);

      if (!result.ok) {
        throw new Error(result.error || "Failed to resend verification email.");
      }

      toast.success(result.data?.message || "Verification email sent.");
    } catch (err: any) {
      console.error("[RESEND_VERIFICATION]", err);
      toast.error(err.message || "Failed to resend verification email.");
    } finally {
      setIsResending(false);
    }
  }

  // Redirecting OR Instructions
  if (isRedirecting || status === "instructions") {
    const isSignedIntoFirebase = !!auth.currentUser;

    return (
      <div className="w-full text-center">
        <div className="py-6 space-y-6">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              {isRedirecting ? (
                <LoaderCircle className="h-8 w-8 text-primary animate-spin" />
              ) : (
                <Mail className="h-8 w-8 text-primary" />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold">{isRedirecting ? "Email Verified!" : "Check your email"}</h2>
            <p className="text-muted-foreground text-base max-w-[360px] mx-auto">
              {isRedirecting
                ? "Verification successful. Redirecting you now..."
                : "We sent a link to your inbox. Please click it to activate your account."}
            </p>
          </div>

          {!isRedirecting && (
            <div className="pt-6 border-t space-y-4 text-left">
              <p className="text-sm text-muted-foreground text-center">
                Didn&apos;t receive it? Resend the verification email below.
              </p>

              {!isSignedIntoFirebase && (
                <div className="space-y-3">
                  <UniversalInput
                    id="resendEmail"
                    name="resendEmail"
                    label="Email"
                    value={resendEmail}
                    onChange={setResendEmail}
                    type="email"
                    placeholder="Enter your email"
                    required={false}
                    disabled={isResending}
                  />
                  <UniversalPasswordInput
                    id="resendPassword"
                    name="resendPassword"
                    label="Password"
                    value={resendPassword}
                    onChange={setResendPassword}
                    placeholder="Enter your password"
                    required={false}
                    disabled={isResending}
                  />
                </div>
              )}

              <Button
                className="w-full h-12"
                onClick={handleResendVerification}
                disabled={isResending || (!isSignedIntoFirebase && (!resendEmail || !resendPassword))}>
                {isResending ? "Sending..." : "Resend verification email"}
              </Button>

              <div className="flex gap-3">
                <Button
                  className="w-full h-12"
                  onClick={handleResendVerification}
                  disabled={isResending || !resendEmail}>
                  {isResending ? "Sending..." : "Resend verification email"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="w-full py-10 text-center">
        <LoaderCircle className="h-10 w-10 text-primary animate-spin mx-auto mb-4" />
        <h1 className="text-2xl font-semibold">Verifying...</h1>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="w-full text-center py-8">
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <XCircle className="h-8 w-8 text-destructive" />
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-2">Verification Failed</h1>
        <p className="text-muted-foreground mb-8">{errorMessage}</p>
        <div className="space-y-3">
          <Button asChild className="w-full h-12">
            <Link href="/verify-email">Try Resending Email</Link>
          </Button>
          <Button asChild variant="outline" className="w-full h-12">
            <Link href="/login">Back to Login</Link>
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
