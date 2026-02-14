// src/app/(auth)/verify-email/page.tsx
import type { Metadata } from "next";
import { siteConfig } from "@/config/siteConfig";
import { VerifyEmailForm } from "@/components";
import { AuthHeader } from "@/components/auth/AuthHeader";

export const metadata: Metadata = {
  title: `Verify Your Email | ${siteConfig.name}`,
  description: "Confirm your email address to activate your account.",
  robots: { index: false, follow: false }
};

export default function VerifyEmailPage() {
  return (
    <div className="max-w-md mx-auto">
      <AuthHeader title="Confirm your account" />
      <div className="mt-2">
        <VerifyEmailForm />
      </div>
    </div>
  );
}
