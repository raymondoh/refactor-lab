"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, ArrowRight, LoaderCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  const attempted = useRef(false);
  const lastToken = useRef<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");

    // If no token, show the instructions page (same UX as before)
    if (!token) {
      setStatus("instructions");
      return;
    }

    // Prevent duplicate calls in React strict mode / re-renders
    if (attempted.current && lastToken.current === token) return;

    attempted.current = true;
    lastToken.current = token;

    setStatus("loading");
    setErrorMessage("");

    const run = async () => {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
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

        // Modern sometimes returns success:true even when token is expired/consumed (graceful case)
        if ("success" in data && data.success) {
          const redirectPath = data.redirectPath || "/dashboard";
          setIsRedirecting(true);
          router.push(redirectPath);
          return;
        }

        // Fallback: treat as success but no redirect
        setStatus("success");
      } catch (error: unknown) {
        console.error("Resolve order error:", error);

        setStatus("error");
        setErrorMessage("An unexpected error occurred. Please try again.");
      }
    };

    void run();
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

          <div className="mt-8 space-y-3">
            <Button asChild className="w-full h-14 text-lg font-semibold">
              <Link href="/verify-email">Resend Verification Email</Link>
            </Button>

            <Button asChild variant="outline" className="w-full h-14 text-lg font-semibold">
              <Link href="/login">Go to login</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Instructions state (same as before)
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
            We&apos;ve sent you a verification email. Please check your inbox and spam folder.
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
