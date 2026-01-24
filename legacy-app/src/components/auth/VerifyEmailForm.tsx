"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, ArrowRight, LoaderCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { auth } from "@/firebase/client/firebase-client-init";
import { applyActionCode } from "firebase/auth";
import { updateEmailVerificationStatus } from "@/actions/auth/email-verification";
import { firebaseError, isFirebaseError } from "@/utils/firebase-error";

export function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<"instructions" | "loading" | "success" | "error">("instructions");
  const [errorMessage, setErrorMessage] = useState("");
  const [isRedirecting, setIsRedirecting] = useState(false);

  const verificationAttempted = useRef(false);
  const processedCode = useRef<string | null>(null);

  useEffect(() => {
    const mode = searchParams.get("mode");
    const oobCode = searchParams.get("oobCode");
    const continueUrl = searchParams.get("continueUrl") || "";

    if (verificationAttempted.current && processedCode.current === oobCode) return;

    if (mode === "verifyEmail" && oobCode) {
      verificationAttempted.current = true;
      processedCode.current = oobCode;
      setStatus("loading");

      let userIdFromContinueUrl = "";
      try {
        const url = new URL(continueUrl);
        userIdFromContinueUrl = url.searchParams.get("uid") || "";
      } catch (e) {
        console.error("Invalid continueUrl format:", e);
      }

      const verifyEmail = async () => {
        try {
          await applyActionCode(auth, oobCode);
          const user = auth.currentUser;

          if (user) {
            await user.reload();
            if (user.emailVerified) {
              await updateEmailVerificationStatus({ userId: user.uid, verified: true });
              setIsRedirecting(true);
              router.push("/verify-success");
            } else {
              setStatus("error");
              setErrorMessage("Email verification failed. Please try again.");
            }
          }
        } catch (error: unknown) {
          if (isFirebaseError(error)) {
            console.error("FirebaseError:", error.code, error.message);

            if (error.code === "auth/invalid-action-code") {
              const user = auth.currentUser;

              try {
                await user?.reload();
              } catch (reloadError) {
                console.error("Reload error:", reloadError);
              }

              if (user?.emailVerified) {
                await updateEmailVerificationStatus({ userId: user.uid, verified: true });
                setIsRedirecting(true);
                router.push("/verify-success");
                return;
              }

              if (userIdFromContinueUrl) {
                try {
                  await updateEmailVerificationStatus({ userId: userIdFromContinueUrl, verified: true });
                  setIsRedirecting(true);
                  router.push("/verify-success");
                  return;
                } catch (firestoreError) {
                  console.error("Firestore update fallback failed:", firestoreError);
                }
              }

              setStatus("error");
              setErrorMessage(
                "This verification link has already been used. If you've already verified your email, you can log in."
              );
            } else {
              setStatus("error");
              setErrorMessage(firebaseError(error));
            }
          } else {
            console.error("Unexpected error:", error);
            setStatus("error");
            setErrorMessage("An unexpected error occurred. Please try again.");
          }
        }
      };

      verifyEmail();
    }
  }, [searchParams, router]);

  if (isRedirecting) {
    return (
      <div className="w-full">
        <div className="relative py-8 sm:py-10 text-center">
          <div className="flex justify-center mb-6">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <LoaderCircle className="h-10 w-10 text-primary animate-spin" />
            </div>
          </div>

          <div className="space-y-2 mb-6">
            <h1 className="text-3xl font-semibold tracking-tight">Redirecting...</h1>
            <p className="text-muted-foreground">Please wait while we redirect you.</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="w-full">
        <div className="relative py-8 sm:py-10 text-center">
          <div className="flex justify-center mb-6">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <LoaderCircle className="h-10 w-10 text-primary animate-spin" />
            </div>
          </div>

          <div className="space-y-2 mb-6">
            <h1 className="text-3xl font-semibold tracking-tight">Verifying Email...</h1>
            <p className="text-muted-foreground">Please wait while we verify your email address.</p>
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
            <h1 className="text-3xl font-semibold tracking-tight">Verification Failed</h1>
            <p className="text-muted-foreground">{errorMessage}</p>
          </div>

          <div className="mt-8">
            <Button asChild className="w-full h-14 text-lg font-semibold">
              <Link href="/verify-email">Resend Verification Email</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Instructions state - show email sent message
  return (
    <div className="w-full">
      <div className="relative py-8 sm:py-10">
        <div className="flex justify-center mb-6">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail className="h-10 w-10 text-primary" />
          </div>
        </div>

        <div className="text-center space-y-2 mb-6">
          <h1 className="text-3xl font-semibold tracking-tight">Check your email</h1>
          <p className="text-muted-foreground">
            We've sent you a verification email. Please check your inbox and spam folder.
          </p>
        </div>

        <div className="text-center space-y-4 text-base">
          <p>
            Click the verification link in the email to activate your account. If you don&apos;t see the email, check
            your spam folder.
          </p>
          <p className="text-sm text-muted-foreground">The verification link will expire in 24 hours.</p>
        </div>

        <div className="mt-10 space-y-4 text-center">
          <Button asChild className="w-full h-14 text-lg font-semibold">
            <Link href="/login">
              Continue to login
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>

          <p className="text-sm text-muted-foreground">
            Didn&apos;t receive an email?{" "}
            <Link href="/verify-email" className="font-semibold text-primary hover:underline">
              Try resending it
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
