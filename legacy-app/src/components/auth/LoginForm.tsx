"use client";

import { useState, useRef, useTransition } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/firebase/client/firebase-client-init";
import { loginUser } from "@/actions/auth";
import { GoogleAuthButton } from "@/components";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import { SubmitButton } from "../shared/SubmitButton";
import { UniversalInput } from "@/components/forms/UniversalInput";
import { UniversalPasswordInput } from "@/components/forms/UniversalPasswordInput";
import { signIn } from "next-auth/react";

interface LoginFormProps extends React.HTMLAttributes<HTMLDivElement> {}

export default function LoginForm({ className, ...props }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { update } = useSession();

  // Local state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();
  const emailInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (value: string) => {
    setter(value);
    if (error) setError(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsFinalizing(true);

    try {
      // 1) Firebase Client Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();

      // 2) NextAuth handshake (NO auto-redirect; we handle navigation ourselves)
      const callbackUrlRaw = searchParams.get("callbackUrl") || "/user";
      const callbackUrl = callbackUrlRaw.startsWith("/admin") ? "/user" : callbackUrlRaw;

      const signInResult = await signIn("credentials", {
        idToken,
        redirect: false,
        callbackUrl
      });

      if (!signInResult) {
        throw new Error("Sign-in failed. Please try again.");
      }

      if (signInResult.error) {
        throw new Error("Session creation failed. Please try again.");
      }

      // 3) Success + redirect
      toast.success("Login successful!");
      router.replace(callbackUrl);
      router.refresh();
    } catch (err: any) {
      console.error("[LOGIN_ERROR]:", err);
      setError(err?.message || "Login failed");
    } finally {
      // Always stop the spinner (even if a redirect happens or something throws early)
      setIsFinalizing(false);
    }
  };

  return (
    <div className={`w-full ${className}`} {...props}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-6 w-6" />
            <AlertDescription className="text-base">{error}</AlertDescription>
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
          ref={emailInputRef}
          disabled={isPending || isFinalizing}
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
            name="password"
            label=""
            value={password}
            onChange={handleInputChange(setPassword)}
            placeholder="Enter your password"
            showLabel={false}
            disabled={isPending || isFinalizing}
          />
        </div>

        <SubmitButton
          isLoading={isPending || isFinalizing}
          loadingText={isFinalizing ? "Authenticating..." : "Signing in..."}
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
            className="mt-4 h-14 text-base font-medium bg-secondary hover:bg-secondary/80 text-white transition-colors"
          />
        </div>

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
