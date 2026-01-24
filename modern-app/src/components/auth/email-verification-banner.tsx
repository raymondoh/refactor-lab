// src/components/auth/email-verification-banner.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, AlertCircle, CheckCircle } from "lucide-react";

interface EmailVerificationBannerProps {
  email: string;
  onResend?: () => void;
}

export function EmailVerificationBanner({ email, onResend }: EmailVerificationBannerProps) {
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleResend = async () => {
    setIsResending(true);
    setError("");
    setResendSuccess(false);

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        setResendSuccess(true);
        onResend?.();
      } else {
        setError(data.error || "Failed to resend verification email");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Card className="border-amber-500/50 bg-card shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-base font-semibold text-foreground">Email Verification Required</h3>

            <p className="text-sm text-muted-foreground mt-1">
              Please verify your email address <strong className="text-foreground">{email}</strong> to access all
              features.
            </p>

            {resendSuccess && (
              <div className="flex items-center space-x-2 mt-3 p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700 dark:text-green-400">Verification email sent!</span>
              </div>
            )}

            {error && (
              <Alert variant="destructive" className="mt-3">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-4">
              <Button size="sm" onClick={handleResend} disabled={isResending || resendSuccess}>
                <Mail className="h-4 w-4 mr-2" />
                {isResending ? "Sending..." : "Resend Email"}
              </Button>

              <span className="text-xs text-muted-foreground">
                Check your spam folder if you don&apos;t see the email.
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
