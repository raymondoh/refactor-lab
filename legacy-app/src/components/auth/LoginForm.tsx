// src/components/auth/LoginForm.tsx
"use client";

import type React from "react";

import { useState, useEffect, useRef, startTransition, useActionState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { signInWithCustomToken } from "firebase/auth";
import { auth } from "@/firebase/client/firebase-client-init";
import { loginUser } from "@/actions/auth";
import { signInWithNextAuth } from "@/firebase/client/next-auth";
import type { LoginResponse } from "@/types/auth/login";
import { GoogleAuthButton } from "@/components";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import { SubmitButton } from "../shared/SubmitButton";
import { UniversalInput } from "@/components/forms/UniversalInput";
import { UniversalPasswordInput } from "@/components/forms/UniversalPasswordInput";

type LoginState = LoginResponse | null;

function sanitizeRedirectPath(input: string | null): string | null {
  if (!input) return null;

  // decode once (in case it’s encoded)
  const value = (() => {
    try {
      return decodeURIComponent(input);
    } catch {
      return input;
    }
  })();

  // Prevent open redirects: must be a relative path starting with "/"
  if (!value.startsWith("/")) return null;

  // Prevent protocol-relative or weird cases
  if (value.startsWith("//")) return null;

  // Optional: block auth pages to avoid loops
  const blocked = ["/login", "/register", "/verify-email", "/forgot-password"];
  if (blocked.some(p => value === p || value.startsWith(`${p}/`))) return null;

  return value;
}

export function LoginForm({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { update } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formKey, setFormKey] = useState(0);

  const [state, action, isPending] = useActionState<LoginState, FormData>(loginUser, null, formKey.toString());

  const loginErrorToastShown = useRef(false);
  const isRedirecting = useRef(false);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const isUnverifiedError = !state?.success && state?.message?.toLowerCase().includes("verify");

  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (value: string) => {
    setter(value);
    if (state?.message && !state.success) {
      setFormKey(prev => prev + 1);
      loginErrorToastShown.current = false;
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);
    formData.append("isRegistration", "false");

    startTransition(() => {
      action(formData);
    });
  };

  useEffect(() => {
    if (!state || loginErrorToastShown.current) return;

    if (state.success) {
      toast.success(state.message || "Login successful!");
      loginErrorToastShown.current = true;
      isRedirecting.current = true;

      const redirectParam = searchParams.get("redirect");
      const safeRedirect = sanitizeRedirectPath(redirectParam);

      const handleRedirect = async () => {
        try {
          if (!auth || !state.data?.customToken) throw new Error("Missing auth or customToken");

          const userCredential = await signInWithCustomToken(auth, state.data.customToken);
          const idToken = await userCredential.user.getIdToken();
          const signInResult = await signInWithNextAuth({ idToken });

          if (!signInResult.success) throw new Error("NextAuth sign-in failed");

          // Ensure next-auth session cookie is refreshed
          const updated = await update();

          // Prefer redirect param (e.g. /user after verify)
          if (safeRedirect) {
            router.replace(safeRedirect);
            return;
          }

          // Otherwise choose a sensible role-based default if possible
          const role = (updated?.user as any)?.role;
          if (role === "admin") {
            router.replace("/admin");
            return;
          }
          if (role === "user") {
            router.replace("/user");
            return;
          }

          // Fallback
          router.replace("/");
        } catch (error) {
          console.error("[LOGIN] Error during redirect:", error);
          toast.error(isFirebaseError(error) ? firebaseError(error) : "An error occurred during login");
          isRedirecting.current = false;
          loginErrorToastShown.current = false;
        }
      };

      void handleRedirect();
    } else if (state.message && !state.success && !loginErrorToastShown.current) {
      loginErrorToastShown.current = true;
      toast.error(state.message || "Login failed.");
    }
  }, [state, router, update, searchParams]);

  return (
    <div className={`w-full ${className}`} {...props}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {state?.message && !state.success && (
          <Alert variant="destructive">
            <AlertCircle className="h-6 w-6" />
            <AlertDescription className="text-base">{state.message}</AlertDescription>
          </Alert>
        )}

        <>
          <UniversalInput
            id="email"
            label="Email"
            value={email}
            onChange={handleInputChange(setEmail)}
            type="email"
            placeholder="Enter your email"
            required
            ref={emailInputRef}
          />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold uppercase tracking-wide">Password</span>
              <Link href="/forgot-password" className="text-sm text-primary font-medium hover:underline">
                Forgot password?
              </Link>
            </div>
            <UniversalPasswordInput
              id="password"
              label=""
              value={password}
              onChange={handleInputChange(setPassword)}
              placeholder="Enter your password"
              showLabel={false}
            />
          </div>

          <SubmitButton
            isLoading={isPending || isRedirecting.current}
            loadingText={isRedirecting.current ? "Redirecting..." : "Signing in..."}
            className="w-full h-14 text-lg font-bold">
            Sign in
          </SubmitButton>

          <div className="my-10">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-muted" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-background px-4 text-sm text-muted-foreground">Or continue with</span>
              </div>
            </div>
            <GoogleAuthButton
              mode="signin"
              className="mt-4 h-14 text-base font-medium bg-secondary hover:bg-secondary/80 text-white dark:text-white transition-colors"
            />
          </div>
        </>

        {state?.message && !state.success && (
          <Alert variant="destructive">
            <AlertCircle className="h-6 w-6" />
            <AlertDescription className="text-base flex flex-col gap-2">
              <span>{state.message}</span>
              {isUnverifiedError && (
                <Link
                  href={`/verify-email?email=${encodeURIComponent(email)}`}
                  className="text-sm font-bold underline hover:opacity-80">
                  Resend verification link
                </Link>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="pt-6 text-center">
          <p className="text-base text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-semibold text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
