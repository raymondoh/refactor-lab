"use client";

import type React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TextButton } from "@/components/ui/text-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, ArrowLeft, AlertCircle } from "lucide-react";
import Image from "next/image";
import { clientLogger } from "@/lib/utils/logger";
import { useRecaptchaAction } from "@/hooks/use-recaptcha-action";
import { RECAPTCHA_ACTIONS } from "@/lib/recaptcha-service";

export function ResendVerificationForm() {
  const searchParams = useSearchParams();
  const initialEmailFromQuery = searchParams.get("email") ?? "";

  const [email, setEmail] = useState(initialEmailFromQuery);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const { recaptcha } = useRecaptchaAction(RECAPTCHA_ACTIONS.RESEND_VERIFICATION);

  // basic email validation – lightweight and safe
  const isEmailValid = !!email && email.includes("@") && email.trim().length > 3;

  useEffect(() => {
    // clear any old error when user edits the email
    if (error) {
      setError("");
    }
  }, [email, error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess(false);

    if (!isEmailValid) {
      setError("Please enter a valid email address.");
      setIsLoading(false);
      return;
    }

    // 🔐 Get reCAPTCHA token via shared hook
    const recaptchaToken = await recaptcha();

    if (!recaptchaToken) {
      clientLogger.warn("[ResendVerificationForm] No reCAPTCHA token returned");
      setError("Could not verify reCAPTCHA. Please try again.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, recaptchaToken })
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.ok) {
        setSuccess(true);
      } else {
        setError(data.error || "Failed to send verification email");
      }
    } catch (err) {
      clientLogger.error("[ResendVerificationForm] Network or fetch error", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="w-full shadow-lg border-border">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-12 h-12 bg-primary rounded-lg flex items-center justify-center shadow-lg">
            <Mail className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold text-foreground">Check Your Email</CardTitle>
            <CardDescription className="text-muted-foreground">Verification link sent</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/20 text-center">
            <p className="text-green-700 dark:text-green-400 font-medium mb-2">Verification email sent!</p>
            <p className="text-sm text-green-600 dark:text-green-500">
              We&apos;ve sent a new verification link to <strong className="font-semibold">{email}</strong>
            </p>
          </div>
          <Button variant="secondary" asChild className="w-full">
            <Link href="/login">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-lg border-border">
      <CardHeader className="space-y-4 text-center">
        <div className="mx-auto w-12 h-12 bg-primary rounded-lg flex items-center justify-center shadow-lg">
          <Image
            src="/images/branding/logo-dark.svg"
            alt="Plumbers Portal Logo"
            width={28}
            height={28}
            className="h-7 w-7 dark:hidden"
          />
          <Image
            src="/images/branding/logo-light.svg"
            alt="Plumbers Portal Logo"
            width={28}
            height={28}
            className="h-7 w-7 hidden dark:block"
          />
        </div>
        <div className="space-y-2">
          <CardTitle className="text-2xl font-bold text-foreground">Resend Verification</CardTitle>
          <CardDescription className="text-muted-foreground">
            Enter your email to receive a new verification link
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="form-label-lg">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              disabled={isLoading}
              placeholder="Enter your email"
              className="input-lg"
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading || !isEmailValid}>
            {isLoading ? "Sending..." : "Send Verification Link"}
          </Button>
        </form>

        <div className="text-center pt-4 border-t border-border">
          <TextButton asChild>
            <Link href="/login">
              <ArrowLeft className="h-3 w-3 mr-1" />
              Back to Login
            </Link>
          </TextButton>
        </div>
      </CardContent>
    </Card>
  );
}
