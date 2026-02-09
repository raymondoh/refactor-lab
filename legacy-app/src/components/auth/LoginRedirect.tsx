// src/components/auth/LoginRedirect.tsx
"use client";

import { useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

function sanitizeRedirectPath(input: string | null): string | null {
  if (!input) return null;

  // Special legacy/UX token: ?redirect=checkout (toast only)
  if (input === "checkout") return "checkout";

  const value = (() => {
    try {
      return decodeURIComponent(input);
    } catch {
      return input;
    }
  })();

  // Must be a safe relative path
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//")) return null;

  // Avoid loops back into auth pages
  const blocked = ["/login", "/register", "/verify-email", "/forgot-password"];
  if (blocked.some(p => value === p || value.startsWith(`${p}/`))) return null;

  return value;
}

export function LoginRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const redirectParam = searchParams.get("redirect");
  const redirectValue = sanitizeRedirectPath(redirectParam);

  const toastShownRef = useRef(false);
  const redirectedRef = useRef(false);

  useEffect(() => {
    // 1) Checkout toast (only)
    if (redirectValue === "checkout" && !toastShownRef.current) {
      toast.info("Please login to complete your purchase", {
        description: "You need to be logged in to proceed to checkout.",
        duration: 5000
      });
      toastShownRef.current = true;
    }
  }, [redirectValue]);

  useEffect(() => {
    // 2) If already signed in, bounce them away from /login to the correct destination.
    if (redirectedRef.current) return;
    if (status === "loading") return;
    if (!session?.user) return;

    redirectedRef.current = true;

    // Prefer a safe explicit redirect path (?redirect=/user etc)
    if (redirectValue && redirectValue !== "checkout") {
      router.replace(redirectValue);
      return;
    }

    // Otherwise role-based default
    const role = (session.user as any)?.role;
    if (role === "admin") {
      router.replace("/admin");
      return;
    }

    router.replace("/user");
  }, [status, session, router, redirectValue]);

  useEffect(() => {
    // Clean up: in production reset flags on unmount; in dev StrictMode keep them stable
    return () => {
      if (process.env.NODE_ENV === "production") {
        toastShownRef.current = false;
        redirectedRef.current = false;
      }
    };
  }, []);

  return null;
}
