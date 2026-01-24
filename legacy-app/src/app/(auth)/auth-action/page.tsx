// app/auth-action/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { Suspense } from "react";

const AuthActionHandler = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const mode = searchParams.get("mode");
    const queryString = window.location.search;

    console.log("[AUTH_ACTION] Handling auth action with mode:", mode);

    if (mode === "verifyEmail") {
      console.log("[AUTH_ACTION] Redirecting to email verification handler");
      router.push(`/verify-email${queryString}`);
    } else if (mode === "resetPassword") {
      console.log("[AUTH_ACTION] Redirecting to password reset handler");
      router.push(`/reset-password${queryString}`);
    } else if (mode === "recoverEmail") {
      console.log("[AUTH_ACTION] Redirecting to email recovery handler");
      router.push(`/recover-email${queryString}`);
    } else {
      console.log("[AUTH_ACTION] Unknown auth action mode, redirecting to home");
      router.push("/");
    }
  }, [router, searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <LoaderCircle className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p>Redirecting to the appropriate page...</p>
      </div>
    </div>
  );
};

const SuspenseWrapper = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <AuthActionHandler />
  </Suspense>
);

export default SuspenseWrapper;
