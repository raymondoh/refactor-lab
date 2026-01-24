// src/app/(auth)/verify-email/page.tsx
export const dynamic = "force-dynamic";

import { VerifyEmailForm } from "@/components/auth/verify-email-form";

export default function VerifyEmailPage() {
  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen">
      <VerifyEmailForm />
    </div>
  );
}
