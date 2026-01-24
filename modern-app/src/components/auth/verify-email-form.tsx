// src/components/auth/verify-email-form.tsx
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { CheckCircle, XCircle, Loader2, AlertCircle, Mail } from "lucide-react";
import { clientLogger } from "@/lib/utils/logger";
import { useRecaptchaAction } from "@/hooks/use-recaptcha-action";
import { RECAPTCHA_ACTIONS } from "@/lib/recaptcha-service";

type Status = "loading" | "success" | "error" | "expired";
type UserRole = "customer" | "tradesperson" | null;

export function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token") ?? "";
  const emailFromQuery = searchParams.get("email") ?? "";
  const continueUrl = searchParams.get("continue") ?? undefined;

  // Ref to prevent duplicate verification calls in dev (React Strict Mode)
  const verificationAttempted = useRef(false);

  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");
  const [userRole, setUserRole] = useState<UserRole>(null);

  const [email, setEmail] = useState(emailFromQuery);
  const [isResending, setIsResending] = useState(false);
  const [resendFeedback, setResendFeedback] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);

  const { recaptcha } = useRecaptchaAction(RECAPTCHA_ACTIONS.RESEND_VERIFICATION);

  const verifyEmail = useCallback(async () => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided.");
      return;
    }

    const storageKey = `pp_verified_token_${token}`;

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
        cache: "no-store"
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
        reason?: string;
        role?: UserRole;
        redirectPath?: string;
      };

      if (response.ok) {
        const apiRole = data.role ?? null;
        setUserRole(apiRole);
        setStatus("success");
        setMessage(data.message || "Email verified successfully!");

        // mark this token as processed so future mounts don't re-verify
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(storageKey, "true");
        }

        const redirectPathFromApi = data.redirectPath || "/dashboard";
        const finalCallback = continueUrl || redirectPathFromApi;

        // Redirect via login so the normal auth flow runs
        setTimeout(() => {
          router.push(`/login?message=verified&callbackUrl=${encodeURIComponent(finalCallback)}`);
        }, 2000);
        return;
      }

      // Error handling with optional "reason" from the API
      const reason = data.reason;
      const errMsg = data.error || "Verification failed. The link may be invalid or expired.";

      if (reason === "expired") {
        setStatus("expired");
        setMessage("Your verification link has expired. You can request a new one below.");
      } else if (reason === "consumed") {
        setStatus("error");
        setMessage("This verification link has already been used. Please log in or request a new one.");
      } else {
        setStatus("error");
        setMessage(errMsg);
      }
    } catch (err) {
      clientLogger.error("Verification error:", err);

      setStatus("error");
      setMessage("An error occurred during verification.");
    }
  }, [token, continueUrl, router]);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided.");
      return;
    }

    // If we've already verified this token in this browser session,
    // skip calling the API again and just show a "success-ish" state.
    if (typeof window !== "undefined") {
      const getStorageKey = (token: string) => `pp_verified_token_${token}`;
      const storageKey = getStorageKey(token);
      //const storageKey = `pp_verified_token_${token}`;
      if (window.sessionStorage.getItem(storageKey)) {
        setStatus("success");
        setMessage("Your email has already been verified. You can continue to sign in.");
        return;
      }
    }

    // Prevent double execution in React Strict Mode on the same mount
    if (verificationAttempted.current) {
      return;
    }
    verificationAttempted.current = true;

    void verifyEmail();
  }, [token, verifyEmail]);

  const handleResend = async () => {
    setIsResending(true);
    setResendFeedback(null);
    setResendError(null);

    if (!email.trim()) {
      setResendError("Please enter your email address.");
      setIsResending(false);
      return;
    }

    const cleanEmail = email.trim();

    // 🔐 Get reCAPTCHA token using shared hook
    const recaptchaToken = await recaptcha();

    if (!recaptchaToken) {
      clientLogger.warn("[VerifyEmailForm] No reCAPTCHA token returned on resend");
      setResendError("Could not verify reCAPTCHA. Please try again.");
      setIsResending(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          recaptchaToken
        }),
        cache: "no-store"
      });

      if (res.ok) {
        const data = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string };
        setResendFeedback(data.message || "If an account exists for that email, we've sent a new verification link.");
      } else {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setResendError(data.error || "Something went wrong. Please try again in a moment.");
      }
    } catch (err) {
      clientLogger.error("[VerifyEmailForm] resend verification error:", err);
      setResendError("Something went wrong. Please try again in a moment.");
    } finally {
      setIsResending(false);
    }
  };

  const getOnboardingLabel = () => {
    if (userRole === "tradesperson") return "Tradesperson";
    if (userRole === "customer") return "Customer";
    return "Account";
  };

  // Loading state
  if (status === "loading") {
    return (
      <Card className="w-full max-w-md shadow-lg border-border">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-12 h-12 bg-primary rounded-lg flex items-center justify-center shadow-lg">
            <Loader2 className="h-6 w-6 text-primary-foreground animate-spin" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold text-foreground">Email Verification</CardTitle>
            <CardDescription className="text-muted-foreground">Verifying your email address...</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-accent p-4 rounded-lg border border-border text-center">
            <p className="text-muted-foreground">Please wait while we verify your email…</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Success state
  if (status === "success") {
    return (
      <Card className="w-full max-w-md shadow-lg border-border">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center shadow-lg">
            <CheckCircle className="h-6 w-6 text-white" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold text-foreground">
              {message.includes("no longer active") ? "Verification Link Used" : "Email Verified!"}
            </CardTitle>

            <CardDescription className="text-muted-foreground">
              Your email has been successfully verified
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/20">
            <p className="text-green-700 dark:text-green-400 font-medium text-center mb-2">{message}</p>
            {userRole && (
              <p className="text-green-700 dark:text-green-500 text-sm text-center">
                Redirecting you to {getOnboardingLabel()} setup…
              </p>
            )}
          </div>

          <div className="bg-accent p-4 rounded-lg border border-border">
            <h4 className="font-medium text-foreground mb-2">What&apos;s next?</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Complete your profile setup</li>
              <li>• {userRole === "tradesperson" ? "Add your service areas" : "Add your location"}</li>
              <li>• Start using Plumbers Portal!</li>
            </ul>
          </div>

          <Button
            onClick={() => {
              // Manual fallback if user clicks early
              const fallbackCallback = continueUrl || "/dashboard";
              router.push(`/login?message=verified&callbackUrl=${encodeURIComponent(fallbackCallback)}`);
            }}
            className="w-full">
            Continue to {getOnboardingLabel()} Setup
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Error or expired state
  return (
    <Card className="w-full max-w-md shadow-lg border-border">
      <CardHeader className="space-y-4 text-center">
        <div className="mx-auto w-12 h-12 bg-destructive rounded-lg flex items-center justify-center shadow-lg">
          <XCircle className="h-6 w-6 text-destructive-foreground" />
        </div>
        <div className="space-y-2">
          <CardTitle className="text-2xl font-bold text-foreground">
            {status === "expired" ? "Verification Link Expired" : "Verification Failed"}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {status === "expired"
              ? "Your verification link can no longer be used."
              : "We couldn’t verify your email address."}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {message || "We couldn't verify your email. Please try again or request a new link."}
          </AlertDescription>
        </Alert>

        {/* Resend flow */}
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <Button type="button" className="w-full" onClick={handleResend} disabled={isResending || !email}>
            {isResending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Resend verification email
              </>
            )}
          </Button>

          {resendFeedback && <p className="text-sm text-foreground/80">{resendFeedback}</p>}
          {resendError && <p className="text-sm text-destructive">{resendError}</p>}
        </div>

        <div className="bg-accent p-4 rounded-lg border border-border">
          <h4 className="font-medium text-foreground mb-2">What you can do:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Check if the link has expired</li>
            <li>• Try requesting a new verification email</li>
            <li>• Contact support if the problem persists</li>
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <Button onClick={() => router.push("/login")} className="w-full">
            Go to Login
          </Button>
          <Button onClick={() => router.push("/register")} variant="subtle" className="w-full">
            Register Again
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
