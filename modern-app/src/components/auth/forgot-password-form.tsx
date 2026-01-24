// src/components/auth/forgot-password-form.tsx
"use client";

import type React from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail, ArrowLeft, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { TextButton } from "@/components/ui/text-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { usePasswordResetRequest } from "@/components/auth/use-password-reset-request";

export function ForgotPasswordForm() {
  const { email, setEmail, isLoading, success, error, submit, resetStatus } = usePasswordResetRequest();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submit();
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
            <CardDescription className="text-muted-foreground">Password reset instructions sent</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/20 text-center">
            <p className="text-green-700 dark:text-green-400 font-medium mb-2">Password reset email sent!</p>
            <p className="text-sm text-green-600 dark:text-green-500">
              We&apos;ve sent a link to <strong className="font-semibold">{email}</strong>
            </p>
          </div>

          <div className="bg-accent p-4 rounded-lg border border-border">
            <h4 className="font-medium text-foreground mb-2">What to do next:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Check your email inbox (and spam folder)</li>
              <li>Click the reset link in the email</li>
              <li>Create a new secure password</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="secondary" asChild className="flex-1">
              <Link href="/login">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Login
              </Link>
            </Button>
            <Button onClick={resetStatus} className="flex-1">
              Send Another Email
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-lg border-border">
      <CardHeader className="space-y-4 text-center">
        <div className="mx-auto w-12 h-12 bg-primary rounded-lg flex items-center justify-center shadow-lg">
          {/* Light Mode: Show light logo on dark (blue) bg */}
          <Image
            src="/images/branding/logo-dark.svg"
            alt="Plumbers Portal Logo"
            width={28}
            height={28}
            className="h-7 w-7 dark:hidden"
          />
          {/* Dark Mode: Show dark logo on light bg */}
          <Image
            src="/images/branding/logo-light.svg"
            alt="Plumbers Portal Logo"
            width={28}
            height={28}
            className="h-7 w-7 hidden dark:block"
          />
        </div>

        <div className="space-y-2">
          <CardTitle className="text-2xl font-bold text-foreground">Reset Your Password</CardTitle>
          <CardDescription className="text-muted-foreground">Enter your email to receive a reset link</CardDescription>
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

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Sending..." : "Send Reset Link"}
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
