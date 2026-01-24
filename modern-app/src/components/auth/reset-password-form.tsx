// src/components/auth/reset-password-form.tsx
"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TextButton } from "@/components/ui/text-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      return;
    }
    const verifyToken = async () => {
      try {
        const response = await fetch("/api/auth/verify-reset-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token })
        });
        setTokenValid(response.ok);
      } catch {
        setTokenValid(false);
      }
    };
    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    if (password.trim() !== confirmPassword.trim()) {
      setError("If an account with that email exists, we have sent a password reset link.");
      setIsLoading(false);
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password })
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/login?reset=true");
        }, 3000);
      } else {
        setError(data.error || "Failed to reset password");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Invalid or expired token view
  if (!token || tokenValid === false) {
    return (
      <Card className="w-full shadow-lg border-border">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-12 h-12 bg-destructive rounded-lg flex items-center justify-center shadow-lg">
            <XCircle className="h-6 w-6 text-destructive-foreground" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold text-foreground">Invalid Reset Link</CardTitle>
            <CardDescription className="text-muted-foreground">
              This link has expired or is no longer valid
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Please request a new password reset link to continue.</AlertDescription>
          </Alert>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild className="flex-1">
              <Link href="/forgot-password">Request New Link</Link>
            </Button>
            <Button variant="secondary" asChild className="flex-1">
              <Link href="/login">Back to Login</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Loading state while verifying token
  if (tokenValid === null) {
    return (
      <Card className="w-full shadow-lg border-border">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-12 h-12 bg-primary rounded-lg flex items-center justify-center shadow-lg">
            <Loader2 className="h-6 w-6 text-primary-foreground animate-spin" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold text-foreground">Verifying Link</CardTitle>
            <CardDescription className="text-muted-foreground">Please wait a moment...</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="text-center">
          <div className="bg-accent p-4 rounded-lg border border-border">
            <p className="text-muted-foreground">Verifying your reset link.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Success state
  if (success) {
    return (
      <Card className="w-full shadow-lg border-border">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center shadow-lg">
            <CheckCircle className="h-6 w-6 text-white" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold text-foreground">Password Reset Successful</CardTitle>
            <CardDescription className="text-muted-foreground">Your password has been updated</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/20 text-center">
            <p className="text-green-600 dark:text-green-400 font-medium">Redirecting to login...</p>
          </div>
          <div className="text-center">
            <Button asChild>
              <Link href="/login">Continue to Login</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Main reset password form
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
          <CardTitle className="text-2xl font-bold text-foreground">Set New Password</CardTitle>
          <CardDescription className="text-muted-foreground">Enter your new password below</CardDescription>
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
            <Label htmlFor="password" className="form-label-lg">
              New Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              minLength={6}
              disabled={isLoading}
              placeholder="Enter new password"
              className="input-lg"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="form-label-lg">
              Confirm New Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
              minLength={6}
              disabled={isLoading}
              placeholder="Confirm new password"
              className="input-lg"
            />
            <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Resetting..." : "Reset Password"}
          </Button>
        </form>
        <div className="text-center pt-4 border-t border-border">
          <TextButton size="sm" asChild>
            <Link href="/login">Back to Login</Link>
          </TextButton>
        </div>
      </CardContent>
    </Card>
  );
}
