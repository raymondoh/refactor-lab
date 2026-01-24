"use client";

import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function VerificationSuccessForm() {
  return (
    <div className="w-full">
      <div className="relative py-8 sm:py-10 text-center">
        <div className="flex justify-center mb-6">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
        </div>

        <div className="mb-6 space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Email Verified!</h1>
          <p className="text-muted-foreground">Your email has been successfully verified.</p>
        </div>

        <div className="text-base space-y-4 mb-10">
          <p>Thank you for verifying your email address. You can now log in to your account and access all features.</p>
        </div>

        <Button asChild className="w-full h-14 text-lg font-semibold">
          <Link href="/login">Continue to Login</Link>
        </Button>
      </div>
    </div>
  );
}
