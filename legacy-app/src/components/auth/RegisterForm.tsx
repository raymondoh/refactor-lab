"use client";

import { useState, useEffect, useRef, useActionState, useTransition } from "react";
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

// Use the new ServiceResult type for the state
type RegisterState = Awaited<ReturnType<typeof registerUser>> | null;

export function RegisterForm({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  const router = useRouter();

  // Local state for inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formKey, setFormKey] = useState(0);

  // Validation UI states
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isTransitionPending, startTransition] = useTransition();

  // 1. Define the Bridge Action inside the component
  const registerFormAction = async (_prev: RegisterState, formData: FormData): Promise<RegisterState> => {
    const emailVal = String(formData.get("email") ?? "");
    const passwordVal = String(formData.get("password") ?? "");
    const confirmPasswordVal = String(formData.get("confirmPassword") ?? "");

    return await registerUser({
      email: emailVal,
      password: passwordVal,
      confirmPassword: confirmPasswordVal
    });
  };

  // 2. Initialize useActionState
  const [state, action, isPending] = useActionState(registerFormAction, null);

  const registerErrorToastShown = useRef(false);
  const verificationEmailSent = useRef(false);

  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (value: string) => {
    setter(value);
    if (state && !state.ok) {
      setFormKey(prev => prev + 1);
      registerErrorToastShown.current = false;
    }
  };

  const validatePassword = (val: string) => {
    if (val.length < 8) return "Password must be at least 8 characters long";
    if (!/(?=.*[a-z])/.test(val)) return "Password must contain a lowercase letter";
    if (!/(?=.*[A-Z])/.test(val)) return "Password must contain an uppercase letter";
    if (!/(?=.*\d)/.test(val)) return "Password must contain a number";
    return null;
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setPasswordError(validatePassword(value));
    if (confirmPassword && value !== confirmPassword) setConfirmPasswordError("Passwords do not match");
    else setConfirmPasswordError(null);
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    setConfirmPasswordError(password && value !== password ? "Passwords do not match" : null);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const passErr = validatePassword(password);
    if (passErr) {
      setPasswordError(passErr);
      return;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      return;
    }

    const formData = new FormData(event.currentTarget);
    startTransition(() => {
      action(formData);
    });
  };

  useEffect(() => {
    if (!state || registerErrorToastShown.current) return;

    if (state.ok && !verificationEmailSent.current) {
      verificationEmailSent.current = true;
      (async () => {
        try {
          setIsLoggingIn(true);

          const { signInWithEmailAndPassword } = await import("firebase/auth");

          // 1) Sign in (real Firebase session)
          const userCredential = await signInWithEmailAndPassword(auth, email, password);

          // 2) Force token refresh (helps avoid weird timing issues)
          await userCredential.user.getIdToken(true);

          // 3) Send verification email
          await sendEmailVerification(userCredential.user, getVerificationSettings());

          await auth.signOut();
          toast.success("Account created! Verification email sent.");
          router.push("/verify-email");
        } catch (err) {
          console.error("[REGISTER] verification flow:", err?.code, err?.message, err);
          toast.error("Account created, but could not send verification email.");
          router.push("/login");
        } finally {
          setIsLoggingIn(false);
        }
      })();
    } else if (!state.ok && !registerErrorToastShown.current) {
      registerErrorToastShown.current = true;
      toast.error(state.error || "Registration failed.");
    }
  }, [state, email, password, router]);

  return (
    <div className={`w-full ${className}`} {...props} key={formKey}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {state && !state.ok && (
          <Alert variant="destructive">
            <AlertCircle className="h-6 w-6" />
            <AlertDescription className="text-base">{state.error}</AlertDescription>
          </Alert>
        )}

        <UniversalInput
          id="email"
          name="email"
          label="Email"
          value={email}
          onChange={handleInputChange(setEmail)}
          type="email"
          placeholder="Enter your email"
          required
        />

        <UniversalPasswordInput
          id="password"
          name="password"
          label="Password"
          value={password}
          onChange={handlePasswordChange}
          placeholder="Create a strong password"
          required
          error={passwordError}
          helpText="8+ characters, uppercase, lowercase, and number"
        />

        <UniversalPasswordInput
          id="confirmPassword"
          name="confirmPassword"
          label="Confirm Password"
          value={confirmPassword}
          onChange={handleConfirmPasswordChange}
          placeholder="Confirm your password"
          required
          error={confirmPasswordError}
        />

        <SubmitButton
          isLoading={isPending || isTransitionPending || isLoggingIn}
          loadingText={isLoggingIn ? "Sending email..." : "Creating account..."}
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
            className="mt-4 h-14 text-base font-medium bg-secondary hover:bg-secondary/80 text-white transition-colors"
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
