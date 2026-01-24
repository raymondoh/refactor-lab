"use client";

import type React from "react";
import { useState, useEffect, useRef, startTransition, useActionState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { registerUser, loginUser } from "@/actions/auth";
import { auth } from "@/firebase/client/firebase-client-init";
import { signInWithCustomToken, sendEmailVerification } from "firebase/auth";
import { getVerificationSettings } from "@/firebase/client/auth";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { SubmitButton } from "@/components/shared/SubmitButton";
import { UniversalInput } from "@/components/forms/UniversalInput";
import { UniversalPasswordInput } from "@/components/forms/UniversalPasswordInput";
import type { RegisterResponse } from "@/types/auth/register";

type RegisterState = RegisterResponse | null;

export function RegisterForm({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formKey, setFormKey] = useState(0);

  // Validation states
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);

  const verificationEmailSent = useRef(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginState, isLoginPending] = useActionState(loginUser, null);

  const [state, action, isPending] = useActionState<RegisterState, FormData>(registerUser, null, formKey.toString());

  const registerErrorToastShown = useRef(false);
  const isRedirecting = useRef(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  function resetForm() {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setPasswordError(null);
    setConfirmPasswordError(null);
    registerErrorToastShown.current = false;
    isRedirecting.current = false;
    verificationEmailSent.current = false;
    nameInputRef.current?.focus();
  }

  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (value: string) => {
    setter(value);
    // Reset error state when user types
    if (state?.message && !state.success) {
      setFormKey(prev => prev + 1);
      registerErrorToastShown.current = false;
    }
  };

  // Password validation
  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return "Password must be at least 8 characters long";
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return "Password must contain at least one lowercase letter";
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/(?=.*\d)/.test(password)) {
      return "Password must contain at least one number";
    }
    return null;
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    const error = validatePassword(value);
    setPasswordError(error);

    // Also check confirm password if it's filled
    if (confirmPassword && value !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
    } else if (confirmPassword && value === confirmPassword) {
      setConfirmPasswordError(null);
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    if (password && value !== password) {
      setConfirmPasswordError("Passwords do not match");
    } else {
      setConfirmPasswordError(null);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Validate passwords before submission
    const passwordValidationError = validatePassword(password);
    if (passwordValidationError) {
      setPasswordError(passwordValidationError);
      toast.error("Please fix password requirements");
      return;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      toast.error("Passwords do not match");
      return;
    }

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);
    formData.append("confirmPassword", confirmPassword);
    formData.append("isRegistration", "true");

    startTransition(() => {
      action(formData);
    });
  };

  useEffect(() => {
    if (!state || registerErrorToastShown.current) return;

    if (state.success && !verificationEmailSent.current) {
      verificationEmailSent.current = true;
      (async () => {
        try {
          setIsLoggingIn(true);

          // 1. create a session-less login so we can get a custom token
          const loginFormData = new FormData();
          loginFormData.append("email", email);
          loginFormData.append("password", password);
          loginFormData.append("isRegistration", "true");
          loginFormData.append("skipSession", "true");
          const loginRes = await loginUser(null, loginFormData);

          if (!loginRes?.success || !loginRes.data?.customToken) {
            throw new Error("Could not sign in to send verification e-mail");
          }

          // 2. exchange token with Firebase client SDK
          const cred = await signInWithCustomToken(auth, loginRes.data.customToken);

          // 3. ask Firebase to send the message
          await sendEmailVerification(cred.user, getVerificationSettings());

          toast.success("Verification e-mail sent! Check your inbox.");
          router.push("/verify-email");
        } catch (err) {
          console.error("[REGISTER] verification flow: ", err);
          toast.error("Could not send verification e-mail.");
        } finally {
          setIsLoggingIn(false);
        }
      })();
    } else if (state?.message && !state.success && !registerErrorToastShown.current) {
      registerErrorToastShown.current = true;
      toast.error(state.message || "Registration failed.");
    }
  }, [state, email, password, router]);

  return (
    <div className={`w-full ${className}`} {...props}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {state?.message && !state.success && (
          <Alert variant="destructive">
            <AlertCircle className="h-6 w-6" />
            <AlertDescription className="text-base">{state.message}</AlertDescription>
          </Alert>
        )}

        <UniversalInput
          id="email"
          label="Email"
          value={email}
          onChange={handleInputChange(setEmail)}
          type="email"
          placeholder="Enter your email"
          required
        />

        <UniversalPasswordInput
          id="password"
          label="Password"
          value={password}
          onChange={handlePasswordChange}
          placeholder="Create a strong password"
          required
          error={passwordError}
          helpText="Must be at least 8 characters with uppercase, lowercase, and number"
        />

        <UniversalPasswordInput
          id="confirmPassword"
          label="Confirm Password"
          value={confirmPassword}
          onChange={handleConfirmPasswordChange}
          placeholder="Confirm your password"
          required
          error={confirmPasswordError}
        />

        <SubmitButton
          isLoading={isPending || isLoggingIn}
          loadingText={isLoggingIn ? "Sending verification email..." : "Creating account..."}
          className="w-full h-14 text-lg font-bold"
          disabled={!!passwordError || !!confirmPasswordError || isLoggingIn}>
          Create Account
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
            mode="signup"
            className="mt-4 h-14 text-base font-medium bg-secondary hover:bg-secondary/80 text-white dark:text-white transition-colors"
          />
        </div>

        <div className="pt-6 text-center">
          <p className="text-base text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
